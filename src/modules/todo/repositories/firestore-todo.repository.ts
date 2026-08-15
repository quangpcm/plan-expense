'use client';

import {
  Timestamp,
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  writeBatch,
  where,
} from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import type {
  AddTodoVendorPersistenceInput,
  CreateTodoPersistenceInput,
  TodoRepository,
  UpdateTodoPersistenceInput,
  UpdateTodoVendorPersistenceInput,
} from '@/modules/todo/repositories/todo.repository';
import type {
  MoveTodoToMilestoneInput,
  ReorderTodosWithinMilestoneInput,
  TodoDocument,
  TodoVendor,
} from '@/modules/todo/types/todo';
import { syncUserPlansAggregate } from '@/shared/lib/firestore/sync-user-plans';
import { mapFirebaseError } from '@/shared/utils/firebase-error';
import { getFallbackTodoOrderIndex, sortTodosByMilestoneOrder, TODO_ORDER_INDEX_STEP } from '@/modules/todo/utils/todo-order';

function normalizeVendor(raw: TodoVendor): TodoVendor {
  return {
    ...raw,
    description: raw.description ?? null,
    attachments: raw.attachments ?? [],
  };
}

function normalizeTodo(raw: TodoDocument): TodoDocument {
  return {
    ...raw,
    orderIndex: Number.isFinite(raw.orderIndex) ? raw.orderIndex : getFallbackTodoOrderIndex(raw),
    budget: raw.budget ?? null,
    vendors: (raw.vendors ?? []).map(normalizeVendor),
    selectedTodoVendorId: raw.selectedTodoVendorId ?? null,
    attachments: raw.attachments ?? [],
  };
}

export class FirestoreTodoRepository implements TodoRepository {
  generateTodoId(planId: string): string {
    return doc(collection(getFirebaseFirestore(), 'plans', planId, 'todos')).id;
  }

  async createTodo(input: CreateTodoPersistenceInput) {
    const db = getFirebaseFirestore();
    const todoRef = doc(db, 'plans', input.planId, 'todos', input.todoId);
    const planRef = doc(db, 'plans', input.planId);
    const milestoneRef = doc(db, 'plans', input.planId, 'milestones', input.milestoneId);
    const now = Timestamp.now();

    await runTransaction(db, async (transaction) => {
      transaction.set(todoRef, {
        id: todoRef.id,
        planId: input.planId,
        milestoneId: input.milestoneId,
        orderIndex: now.toMillis(),
        title: input.title,
        description: input.description,
        assigneeMemberId: input.assigneeMemberId,
        dueDate: input.dueDate ? Timestamp.fromDate(input.dueDate) : null,
        priority: input.priority,
        status: 'todo',
        budget: input.budget,
        vendors: [],
        selectedTodoVendorId: null,
        attachments: input.attachments,
        createdByUserId: input.createdByUserId,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        cancelledAt: null,
      } satisfies TodoDocument);

      transaction.update(planRef, {
        todoCount: increment(1),
        updatedAt: now,
      });

      transaction.update(milestoneRef, {
        todoCount: increment(1),
        updatedAt: now,
      });
    });

    await syncUserPlansAggregate(input.planId, {
      todoCount: increment(1),
      updatedAt: now,
    });

    return { todoId: todoRef.id };
  }

  async updateTodo(planId: string, input: UpdateTodoPersistenceInput) {
    const db = getFirebaseFirestore();
    const todoRef = doc(db, 'plans', planId, 'todos', input.todoId);
    const planRef = doc(db, 'plans', planId);
    const milestoneRef = doc(db, 'plans', planId, 'milestones', input.milestoneId);
    const now = Timestamp.now();

    const completedDelta = await runTransaction(db, async (transaction) => {
      const todoSnapshot = await transaction.get(todoRef);

      if (!todoSnapshot.exists()) {
        throw new Error('Todo not found.');
      }

      const previousTodo = todoSnapshot.data() as TodoDocument;

      if (input.milestoneId !== previousTodo.milestoneId) {
        throw new Error('Use moveTodoToMilestone() to move a todo between milestones.');
      }

      const completedDelta =
        previousTodo.status !== 'done' && input.status === 'done'
          ? 1
          : previousTodo.status === 'done' && input.status !== 'done'
            ? -1
            : 0;

      transaction.update(todoRef, {
        title: input.title,
        description: input.description?.trim() || null,
        assigneeMemberId: input.assigneeMemberId?.trim() || null,
        dueDate: input.dueDate ? Timestamp.fromDate(new Date(input.dueDate)) : null,
        priority: input.priority,
        status: input.status,
        budget: input.budget !== undefined ? input.budget : previousTodo.budget ?? null,
        selectedTodoVendorId:
          input.selectedTodoVendorId !== undefined
            ? input.selectedTodoVendorId?.trim() || null
            : previousTodo.selectedTodoVendorId ?? null,
        attachments: input.attachments !== undefined ? input.attachments : previousTodo.attachments ?? [],
        updatedAt: now,
        completedAt: input.status === 'done' ? previousTodo.completedAt ?? now : null,
        cancelledAt: input.status === 'cancelled' ? previousTodo.cancelledAt ?? now : null,
      });

      transaction.update(planRef, {
        completedTodoCount: increment(completedDelta),
        updatedAt: now,
      });

      transaction.update(milestoneRef, {
        completedTodoCount: increment(completedDelta),
        updatedAt: now,
      });

      return completedDelta;
    });

    if (completedDelta !== 0) {
      await syncUserPlansAggregate(planId, {
        completedTodoCount: increment(completedDelta),
        updatedAt: now,
      });
    }
  }

  async reorderTodosWithinMilestone(planId: string, input: ReorderTodosWithinMilestoneInput) {
    const db = getFirebaseFirestore();
    const now = Timestamp.now();
    const todosSnapshot = await getDocs(
      query(collection(db, 'plans', planId, 'todos'), where('milestoneId', '==', input.milestoneId)),
    );
    const todos = sortTodosByMilestoneOrder(
      todosSnapshot.docs.map((snapshot) => normalizeTodo(snapshot.data() as TodoDocument)),
    );
    const existingTodoIds = new Set(todos.map((todo) => todo.id));

    if (
      todos.length !== input.orderedTodoIds.length ||
      input.orderedTodoIds.some((todoId) => !existingTodoIds.has(todoId))
    ) {
      throw new Error('Ordered todo ids do not match this milestone.');
    }

    const batch = writeBatch(db);

    input.orderedTodoIds.forEach((todoId, index) => {
      batch.update(doc(db, 'plans', planId, 'todos', todoId), {
        orderIndex: (index + 1) * TODO_ORDER_INDEX_STEP,
        updatedAt: now,
      });
    });

    batch.update(doc(db, 'plans', planId), {
      updatedAt: now,
    });

    batch.update(doc(db, 'plans', planId, 'milestones', input.milestoneId), {
      updatedAt: now,
    });

    await batch.commit();
  }

  async moveTodoToMilestone(planId: string, input: MoveTodoToMilestoneInput) {
    const db = getFirebaseFirestore();
    const now = Timestamp.now();
    const todoRef = doc(db, 'plans', planId, 'todos', input.todoId);
    const planRef = doc(db, 'plans', planId);

    await runTransaction(db, async (transaction) => {
      const todoSnapshot = await transaction.get(todoRef);

      if (!todoSnapshot.exists()) {
        throw new Error('Todo not found.');
      }

      const todo = normalizeTodo(todoSnapshot.data() as TodoDocument);

      if (todo.milestoneId === input.targetMilestoneId) {
        return;
      }

      const sourceMilestoneRef = doc(db, 'plans', planId, 'milestones', todo.milestoneId);
      const targetMilestoneRef = doc(db, 'plans', planId, 'milestones', input.targetMilestoneId);
      const [sourceMilestoneSnapshot, targetMilestoneSnapshot] = await Promise.all([
        transaction.get(sourceMilestoneRef),
        transaction.get(targetMilestoneRef),
      ]);

      if (!sourceMilestoneSnapshot.exists() || !targetMilestoneSnapshot.exists()) {
        throw new Error('Milestone not found.');
      }

      transaction.update(todoRef, {
        milestoneId: input.targetMilestoneId,
        orderIndex: now.toMillis(),
        updatedAt: now,
      });

      transaction.update(sourceMilestoneRef, {
        todoCount: increment(-1),
        completedTodoCount: increment(todo.status === 'done' ? -1 : 0),
        updatedAt: now,
      });

      transaction.update(targetMilestoneRef, {
        todoCount: increment(1),
        completedTodoCount: increment(todo.status === 'done' ? 1 : 0),
        updatedAt: now,
      });

      transaction.update(planRef, {
        updatedAt: now,
      });
    });
  }

  async addVendor(planId: string, todoId: string, vendor: AddTodoVendorPersistenceInput) {
    const db = getFirebaseFirestore();
    const todoRef = doc(db, 'plans', planId, 'todos', todoId);
    const now = Timestamp.now();

    await runTransaction(db, async (transaction) => {
      const todoSnapshot = await transaction.get(todoRef);

      if (!todoSnapshot.exists()) {
        throw new Error('Todo not found.');
      }

      const previousTodo = todoSnapshot.data() as TodoDocument;
      const newVendor: TodoVendor = {
        id: vendor.id,
        name: vendor.name,
        description: vendor.description,
        link: vendor.link,
        price: vendor.price,
        attachments: vendor.attachments,
      };

      transaction.update(todoRef, {
        vendors: [...(previousTodo.vendors ?? []).map(normalizeVendor), newVendor],
        updatedAt: now,
      });
    });
  }

  async updateVendor(planId: string, todoId: string, input: UpdateTodoVendorPersistenceInput) {
    const db = getFirebaseFirestore();
    const todoRef = doc(db, 'plans', planId, 'todos', todoId);
    const now = Timestamp.now();

    await runTransaction(db, async (transaction) => {
      const todoSnapshot = await transaction.get(todoRef);

      if (!todoSnapshot.exists()) {
        throw new Error('Todo not found.');
      }

      const previousTodo = todoSnapshot.data() as TodoDocument;
      const previousVendors = (previousTodo.vendors ?? []).map(normalizeVendor);
      const targetVendor = previousVendors.find((vendor) => vendor.id === input.vendorId);

      if (!targetVendor) {
        throw new Error('Vendor not found.');
      }

      const updatedVendor: TodoVendor = {
        ...targetVendor,
        name: input.name,
        description: input.description,
        link: input.link,
        price: input.price,
        attachments: input.attachments !== undefined ? input.attachments : targetVendor.attachments,
      };

      transaction.update(todoRef, {
        vendors: previousVendors.map((vendor) => (vendor.id === input.vendorId ? updatedVendor : vendor)),
        updatedAt: now,
      });
    });
  }

  async deleteVendor(planId: string, todoId: string, vendorId: string) {
    const db = getFirebaseFirestore();
    const todoRef = doc(db, 'plans', planId, 'todos', todoId);
    const now = Timestamp.now();

    await runTransaction(db, async (transaction) => {
      const todoSnapshot = await transaction.get(todoRef);

      if (!todoSnapshot.exists()) {
        throw new Error('Todo not found.');
      }

      const previousTodo = todoSnapshot.data() as TodoDocument;
      const previousVendors = (previousTodo.vendors ?? []).map(normalizeVendor);

      if (!previousVendors.some((vendor) => vendor.id === vendorId)) {
        throw new Error('Vendor not found.');
      }

      transaction.update(todoRef, {
        vendors: previousVendors.filter((vendor) => vendor.id !== vendorId),
        selectedTodoVendorId: previousTodo.selectedTodoVendorId === vendorId ? null : previousTodo.selectedTodoVendorId,
        updatedAt: now,
      });
    });
  }

  async selectVendor(planId: string, todoId: string, vendorId: string | null) {
    const db = getFirebaseFirestore();
    const todoRef = doc(db, 'plans', planId, 'todos', todoId);
    const now = Timestamp.now();

    await runTransaction(db, async (transaction) => {
      const todoSnapshot = await transaction.get(todoRef);

      if (!todoSnapshot.exists()) {
        throw new Error('Todo not found.');
      }

      const previousTodo = normalizeTodo(todoSnapshot.data() as TodoDocument);

      if (vendorId && !previousTodo.vendors.some((vendor) => vendor.id === vendorId)) {
        throw new Error('Vendor not found.');
      }

      transaction.update(todoRef, {
        selectedTodoVendorId: vendorId,
        updatedAt: now,
      });
    });
  }

  async deleteTodo(planId: string, todoId: string) {
    const db = getFirebaseFirestore();
    const todoRef = doc(db, 'plans', planId, 'todos', todoId);
    const planRef = doc(db, 'plans', planId);
    const now = Timestamp.now();

    const deletedTodo = await runTransaction(db, async (transaction) => {
      const todoSnapshot = await transaction.get(todoRef);

      if (!todoSnapshot.exists()) {
        return null;
      }

      const previousTodo = todoSnapshot.data() as TodoDocument;
      const milestoneRef = doc(db, 'plans', planId, 'milestones', previousTodo.milestoneId);

      transaction.delete(todoRef);

      transaction.update(planRef, {
        todoCount: increment(-1),
        completedTodoCount: increment(previousTodo.status === 'done' ? -1 : 0),
        updatedAt: now,
      });

      transaction.update(milestoneRef, {
        todoCount: increment(-1),
        completedTodoCount: increment(previousTodo.status === 'done' ? -1 : 0),
        updatedAt: now,
      });

      return previousTodo;
    });

    if (deletedTodo) {
      await syncUserPlansAggregate(planId, {
        todoCount: increment(-1),
        completedTodoCount: increment(deletedTodo.status === 'done' ? -1 : 0),
        updatedAt: now,
      });
    }
  }

  watchTodos(
    planId: string,
    callback: (todos: TodoDocument[]) => void,
    onError?: (error: Error) => void,
  ) {
    const todosQuery = query(
      collection(getFirebaseFirestore(), 'plans', planId, 'todos'),
      orderBy('createdAt', 'desc'),
    );

    return onSnapshot(
      todosQuery,
      (snapshot) => {
        callback(snapshot.docs.map((item) => normalizeTodo(item.data() as TodoDocument)));
      },
      (error) => {
        onError?.(mapFirebaseError(error, 'Unable to load todos for this plan.', 'TODO_WATCH_FAILED'));
      },
    );
  }

  watchTodosByMilestone(
    planId: string,
    milestoneId: string,
    callback: (todos: TodoDocument[]) => void,
    onError?: (error: Error) => void,
  ) {
    const todosQuery = query(
      collection(getFirebaseFirestore(), 'plans', planId, 'todos'),
      where('milestoneId', '==', milestoneId),
    );

    return onSnapshot(
      todosQuery,
      (snapshot) => {
        callback(sortTodosByMilestoneOrder(snapshot.docs.map((item) => normalizeTodo(item.data() as TodoDocument))));
      },
      (error) => {
        onError?.(mapFirebaseError(error, 'Unable to load todos for this milestone.', 'TODO_BY_MILESTONE_WATCH_FAILED'));
      },
    );
  }
}
