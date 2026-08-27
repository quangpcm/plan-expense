'use client';

import {
  Timestamp,
  doc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  runTransaction,
  writeBatch,
  where,
} from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import {
  getPlanCollectionRef,
  getPlanDocumentRef,
  getPlanRootRef,
  queryByPlanCollection,
} from '@/modules/plan';
import { ACTIVE_TODO_STATUSES } from '@/modules/todo/constants/todo-status';
import type {
  AddTodoVendorPersistenceInput,
  CreateTodoPersistenceInput,
  TodoDueWindowQuery,
  TodoOverdueQuery,
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
import { diffRemovedAttachments } from '@/modules/storage/utils/diff-attachments';
import { recalculateEstimatedAmounts } from '@/shared/lib/firestore/recalculate-estimated-amounts';
import { syncUserPlansAggregate } from '@/shared/lib/firestore/sync-user-plans';
import { mapFirebaseError } from '@/shared/utils/firebase-error';
import { getTodoBudgetAmount } from '@/modules/todo/utils/todo-budget';
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

function getTodoEstimatedAmount(todo: TodoDocument) {
  return getTodoBudgetAmount(todo) ?? 0;
}

export class FirestoreTodoRepository implements TodoRepository {
  generateTodoId(planId: string): string {
    return doc(getPlanCollectionRef(getFirebaseFirestore(), planId, 'todos')).id;
  }

  async createTodo(input: CreateTodoPersistenceInput) {
    const db = getFirebaseFirestore();
    const todoRef = getPlanDocumentRef(db, input.planId, 'todos', input.todoId);
    const planRef = getPlanRootRef(db, input.planId);
    const milestoneRef = getPlanDocumentRef(db, input.planId, 'milestones', input.milestoneId);
    const now = Timestamp.now();
    const estimatedAmount = input.budget ?? 0;

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
        estimatedAmount: increment(estimatedAmount),
        updatedAt: now,
      });

      transaction.update(milestoneRef, {
        todoCount: increment(1),
        estimatedAmount: increment(estimatedAmount),
        updatedAt: now,
      });
    });

    await syncUserPlansAggregate(input.planId, {
      todoCount: increment(1),
      estimatedAmount: increment(estimatedAmount),
      updatedAt: now,
    });
    await recalculateEstimatedAmounts(input.planId);

    return { todoId: todoRef.id };
  }

  async updateTodo(planId: string, input: UpdateTodoPersistenceInput) {
    const db = getFirebaseFirestore();
    const todoRef = getPlanDocumentRef(db, planId, 'todos', input.todoId);
    const planRef = getPlanRootRef(db, planId);
    const milestoneRef = getPlanDocumentRef(db, planId, 'milestones', input.milestoneId);
    const now = Timestamp.now();

    const { completedDelta, estimatedDelta, orphanedAttachments } = await runTransaction(db, async (transaction) => {
      const todoSnapshot = await transaction.get(todoRef);

      if (!todoSnapshot.exists()) {
        throw new Error('Todo not found.');
      }

      const previousTodo = normalizeTodo(todoSnapshot.data() as TodoDocument);

      if (input.milestoneId !== previousTodo.milestoneId) {
        throw new Error('Use moveTodoToMilestone() to move a todo between milestones.');
      }

      const completedDelta =
        previousTodo.status !== 'done' && input.status === 'done'
          ? 1
          : previousTodo.status === 'done' && input.status !== 'done'
            ? -1
            : 0;
      const nextAttachments = input.attachments !== undefined ? input.attachments : previousTodo.attachments ?? [];
      const orphanedAttachments = diffRemovedAttachments(previousTodo.attachments ?? [], nextAttachments);
      const nextSelectedTodoVendorId =
        input.selectedTodoVendorId !== undefined
          ? input.selectedTodoVendorId?.trim() || null
          : previousTodo.selectedTodoVendorId ?? null;
      const nextBudget = input.budget !== undefined ? input.budget : previousTodo.budget ?? null;
      const nextTodo = normalizeTodo({
        ...previousTodo,
        title: input.title,
        description: input.description?.trim() || null,
        assigneeMemberId: input.assigneeMemberId?.trim() || null,
        dueDate: input.dueDate ? Timestamp.fromDate(new Date(input.dueDate)) : null,
        priority: input.priority,
        status: input.status,
        budget: nextBudget,
        selectedTodoVendorId: nextSelectedTodoVendorId,
        attachments: nextAttachments,
        updatedAt: now,
        completedAt: input.status === 'done' ? previousTodo.completedAt ?? now : null,
        cancelledAt: input.status === 'cancelled' ? previousTodo.cancelledAt ?? now : null,
      });
      const estimatedDelta = getTodoEstimatedAmount(nextTodo) - getTodoEstimatedAmount(previousTodo);

      transaction.update(todoRef, {
        title: input.title,
        description: input.description?.trim() || null,
        assigneeMemberId: input.assigneeMemberId?.trim() || null,
        dueDate: input.dueDate ? Timestamp.fromDate(new Date(input.dueDate)) : null,
        priority: input.priority,
        status: input.status,
        budget: nextBudget,
        selectedTodoVendorId: nextSelectedTodoVendorId,
        attachments: nextAttachments,
        updatedAt: now,
        completedAt: input.status === 'done' ? previousTodo.completedAt ?? now : null,
        cancelledAt: input.status === 'cancelled' ? previousTodo.cancelledAt ?? now : null,
      });

      transaction.update(planRef, {
        completedTodoCount: increment(completedDelta),
        estimatedAmount: increment(estimatedDelta),
        updatedAt: now,
      });

      transaction.update(milestoneRef, {
        completedTodoCount: increment(completedDelta),
        estimatedAmount: increment(estimatedDelta),
        updatedAt: now,
      });

      return { completedDelta, estimatedDelta, orphanedAttachments };
    });

    if (completedDelta !== 0 || estimatedDelta !== 0) {
      await syncUserPlansAggregate(planId, {
        ...(completedDelta !== 0 ? { completedTodoCount: increment(completedDelta) } : {}),
        ...(estimatedDelta !== 0 ? { estimatedAmount: increment(estimatedDelta) } : {}),
        updatedAt: now,
      });
    }
    await recalculateEstimatedAmounts(planId);

    return { orphanedAttachments };
  }

  async reorderTodosWithinMilestone(planId: string, input: ReorderTodosWithinMilestoneInput) {
    const db = getFirebaseFirestore();
    const now = Timestamp.now();
    const todosSnapshot = await getDocs(
      queryByPlanCollection(db, planId, 'todos', where('milestoneId', '==', input.milestoneId)),
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
      batch.update(getPlanDocumentRef(db, planId, 'todos', todoId), {
        orderIndex: (index + 1) * TODO_ORDER_INDEX_STEP,
        updatedAt: now,
      });
    });

    batch.update(getPlanRootRef(db, planId), {
      updatedAt: now,
    });

    batch.update(getPlanDocumentRef(db, planId, 'milestones', input.milestoneId), {
      updatedAt: now,
    });

    await batch.commit();
  }

  async moveTodoToMilestone(planId: string, input: MoveTodoToMilestoneInput) {
    const db = getFirebaseFirestore();
    const now = Timestamp.now();
    const todoRef = getPlanDocumentRef(db, planId, 'todos', input.todoId);
    const planRef = getPlanRootRef(db, planId);

    await runTransaction(db, async (transaction) => {
      const todoSnapshot = await transaction.get(todoRef);

      if (!todoSnapshot.exists()) {
        throw new Error('Todo not found.');
      }

      const todo = normalizeTodo(todoSnapshot.data() as TodoDocument);
      const estimatedAmount = getTodoEstimatedAmount(todo);

      if (todo.milestoneId === input.targetMilestoneId) {
        return;
      }

      const sourceMilestoneRef = getPlanDocumentRef(db, planId, 'milestones', todo.milestoneId);
      const targetMilestoneRef = getPlanDocumentRef(db, planId, 'milestones', input.targetMilestoneId);
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
        estimatedAmount: increment(-estimatedAmount),
        updatedAt: now,
      });

      transaction.update(targetMilestoneRef, {
        todoCount: increment(1),
        completedTodoCount: increment(todo.status === 'done' ? 1 : 0),
        estimatedAmount: increment(estimatedAmount),
        updatedAt: now,
      });

      transaction.update(planRef, {
        updatedAt: now,
      });
    });
    await recalculateEstimatedAmounts(planId);
  }

  async addVendor(planId: string, todoId: string, vendor: AddTodoVendorPersistenceInput) {
    const db = getFirebaseFirestore();
    const todoRef = getPlanDocumentRef(db, planId, 'todos', todoId);
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
    const todoRef = getPlanDocumentRef(db, planId, 'todos', todoId);
    const planRef = getPlanRootRef(db, planId);
    const now = Timestamp.now();

    const { estimatedDelta, orphanedAttachments } = await runTransaction(db, async (transaction) => {
      const todoSnapshot = await transaction.get(todoRef);

      if (!todoSnapshot.exists()) {
        throw new Error('Todo not found.');
      }

      const previousTodo = normalizeTodo(todoSnapshot.data() as TodoDocument);
      const previousVendors = (previousTodo.vendors ?? []).map(normalizeVendor);
      const targetVendor = previousVendors.find((vendor) => vendor.id === input.vendorId);

      if (!targetVendor) {
        throw new Error('Vendor not found.');
      }

      const nextAttachments = input.attachments !== undefined ? input.attachments : targetVendor.attachments;
      const updatedVendor: TodoVendor = {
        ...targetVendor,
        name: input.name,
        description: input.description,
        link: input.link,
        price: input.price,
        attachments: nextAttachments,
      };
      const nextTodo = normalizeTodo({
        ...previousTodo,
        vendors: previousVendors.map((vendor) => (vendor.id === input.vendorId ? updatedVendor : vendor)),
      });
      const estimatedDelta = getTodoEstimatedAmount(nextTodo) - getTodoEstimatedAmount(previousTodo);
      const milestoneRef = getPlanDocumentRef(db, planId, 'milestones', previousTodo.milestoneId);

      transaction.update(todoRef, {
        vendors: nextTodo.vendors,
        updatedAt: now,
      });

      if (estimatedDelta !== 0) {
        transaction.update(planRef, {
          estimatedAmount: increment(estimatedDelta),
          updatedAt: now,
        });
        transaction.update(milestoneRef, {
          estimatedAmount: increment(estimatedDelta),
          updatedAt: now,
        });
      }

      return {
        estimatedDelta,
        orphanedAttachments: diffRemovedAttachments(targetVendor.attachments, nextAttachments),
      };
    });

    if (estimatedDelta !== 0) {
      await syncUserPlansAggregate(planId, {
        estimatedAmount: increment(estimatedDelta),
        updatedAt: now,
      });
    }
    await recalculateEstimatedAmounts(planId);

    return { orphanedAttachments };
  }

  async deleteVendor(planId: string, todoId: string, vendorId: string) {
    const db = getFirebaseFirestore();
    const todoRef = getPlanDocumentRef(db, planId, 'todos', todoId);
    const planRef = getPlanRootRef(db, planId);
    const now = Timestamp.now();

    const { estimatedDelta, orphanedAttachments } = await runTransaction(db, async (transaction) => {
      const todoSnapshot = await transaction.get(todoRef);

      if (!todoSnapshot.exists()) {
        throw new Error('Todo not found.');
      }

      const previousTodo = normalizeTodo(todoSnapshot.data() as TodoDocument);
      const previousVendors = (previousTodo.vendors ?? []).map(normalizeVendor);
      const targetVendor = previousVendors.find((vendor) => vendor.id === vendorId);

      if (!targetVendor) {
        throw new Error('Vendor not found.');
      }

      const nextTodo = normalizeTodo({
        ...previousTodo,
        vendors: previousVendors.filter((vendor) => vendor.id !== vendorId),
        selectedTodoVendorId: previousTodo.selectedTodoVendorId === vendorId ? null : previousTodo.selectedTodoVendorId,
      });
      const estimatedDelta = getTodoEstimatedAmount(nextTodo) - getTodoEstimatedAmount(previousTodo);
      const milestoneRef = getPlanDocumentRef(db, planId, 'milestones', previousTodo.milestoneId);

      transaction.update(todoRef, {
        vendors: nextTodo.vendors,
        selectedTodoVendorId: nextTodo.selectedTodoVendorId,
        updatedAt: now,
      });

      if (estimatedDelta !== 0) {
        transaction.update(planRef, {
          estimatedAmount: increment(estimatedDelta),
          updatedAt: now,
        });
        transaction.update(milestoneRef, {
          estimatedAmount: increment(estimatedDelta),
          updatedAt: now,
        });
      }

      return { estimatedDelta, orphanedAttachments: targetVendor.attachments };
    });

    if (estimatedDelta !== 0) {
      await syncUserPlansAggregate(planId, {
        estimatedAmount: increment(estimatedDelta),
        updatedAt: now,
      });
    }
    await recalculateEstimatedAmounts(planId);

    return { orphanedAttachments };
  }

  async selectVendor(planId: string, todoId: string, vendorId: string | null) {
    const db = getFirebaseFirestore();
    const todoRef = getPlanDocumentRef(db, planId, 'todos', todoId);
    const planRef = getPlanRootRef(db, planId);
    const now = Timestamp.now();
    const normalizedVendorId = vendorId?.trim() || null;

    const estimatedDelta = await runTransaction(db, async (transaction) => {
      const todoSnapshot = await transaction.get(todoRef);

      if (!todoSnapshot.exists()) {
        throw new Error('Todo not found.');
      }

      const previousTodo = normalizeTodo(todoSnapshot.data() as TodoDocument);

      if (normalizedVendorId && !previousTodo.vendors.some((vendor) => vendor.id === normalizedVendorId)) {
        throw new Error('Vendor not found.');
      }

      const nextTodo = normalizeTodo({
        ...previousTodo,
        selectedTodoVendorId: normalizedVendorId,
      });
      const estimatedDelta = getTodoEstimatedAmount(nextTodo) - getTodoEstimatedAmount(previousTodo);
      const milestoneRef = getPlanDocumentRef(db, planId, 'milestones', previousTodo.milestoneId);

      transaction.update(todoRef, {
        selectedTodoVendorId: normalizedVendorId,
        updatedAt: now,
      });

      if (estimatedDelta !== 0) {
        transaction.update(planRef, {
          estimatedAmount: increment(estimatedDelta),
          updatedAt: now,
        });
        transaction.update(milestoneRef, {
          estimatedAmount: increment(estimatedDelta),
          updatedAt: now,
        });
      }

      return estimatedDelta;
    });

    if (estimatedDelta !== 0) {
      await syncUserPlansAggregate(planId, {
        estimatedAmount: increment(estimatedDelta),
        updatedAt: now,
      });
    }
    await recalculateEstimatedAmounts(planId);
  }

  async deleteTodo(planId: string, todoId: string) {
    const db = getFirebaseFirestore();
    const todoRef = getPlanDocumentRef(db, planId, 'todos', todoId);
    const planRef = getPlanRootRef(db, planId);
    const now = Timestamp.now();

    const deletedTodo = await runTransaction(db, async (transaction) => {
      const todoSnapshot = await transaction.get(todoRef);

      if (!todoSnapshot.exists()) {
        return null;
      }

      const previousTodo = normalizeTodo(todoSnapshot.data() as TodoDocument);
      const milestoneRef = getPlanDocumentRef(db, planId, 'milestones', previousTodo.milestoneId);
      const estimatedAmount = getTodoEstimatedAmount(previousTodo);

      transaction.delete(todoRef);

      transaction.update(planRef, {
        todoCount: increment(-1),
        completedTodoCount: increment(previousTodo.status === 'done' ? -1 : 0),
        estimatedAmount: increment(-estimatedAmount),
        updatedAt: now,
      });

      transaction.update(milestoneRef, {
        todoCount: increment(-1),
        completedTodoCount: increment(previousTodo.status === 'done' ? -1 : 0),
        estimatedAmount: increment(-estimatedAmount),
        updatedAt: now,
      });

      return previousTodo;
    });

    if (deletedTodo) {
      await syncUserPlansAggregate(planId, {
        todoCount: increment(-1),
        completedTodoCount: increment(deletedTodo.status === 'done' ? -1 : 0),
        estimatedAmount: increment(-getTodoEstimatedAmount(normalizeTodo(deletedTodo))),
        updatedAt: now,
      });
    }
    await recalculateEstimatedAmounts(planId);

    const orphanedAttachments = deletedTodo
      ? [...(deletedTodo.attachments ?? []), ...(deletedTodo.vendors ?? []).flatMap((vendor) => vendor.attachments)]
      : [];

    return { orphanedAttachments };
  }

  watchTodos(
    planId: string,
    callback: (todos: TodoDocument[]) => void,
    onError?: (error: Error) => void,
  ) {
    const todosQuery = queryByPlanCollection(
      getFirebaseFirestore(),
      planId,
      'todos',
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
    const todosQuery = queryByPlanCollection(
      getFirebaseFirestore(),
      planId,
      'todos',
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

  async getOverdueActiveTodos(planId: string, params: TodoOverdueQuery) {
    const todosQuery = queryByPlanCollection(
      getFirebaseFirestore(),
      planId,
      'todos',
      where('status', 'in', ACTIVE_TODO_STATUSES),
      where('dueDate', '<', Timestamp.fromDate(params.beforeAt)),
      orderBy('dueDate', 'asc'),
      limit(params.limitCount),
    );

    const snapshot = await getDocs(todosQuery);

    return snapshot.docs.map((item) => normalizeTodo(item.data() as TodoDocument));
  }

  async getActiveTodosDueBetween(planId: string, params: TodoDueWindowQuery) {
    const todosQuery = queryByPlanCollection(
      getFirebaseFirestore(),
      planId,
      'todos',
      where('status', 'in', ACTIVE_TODO_STATUSES),
      where('dueDate', '>=', Timestamp.fromDate(params.startAt)),
      where('dueDate', '<', Timestamp.fromDate(params.endAt)),
      orderBy('dueDate', 'asc'),
      limit(params.limitCount),
    );

    const snapshot = await getDocs(todosQuery);

    return snapshot.docs.map((item) => normalizeTodo(item.data() as TodoDocument));
  }

  // Today Progress (Phase 4) — bounded one-shot query for completed todos due today, so
  // completedTodayCount isn't undercounted just because today-summary's other queries only ever
  // fetch active statuses. Same composite index as getActiveTodosDueBetween/getOverdueActiveTodos
  // (firestore.indexes.json: todos → status ASC, dueDate ASC) already covers this — an equality
  // filter on `status` plus a range/orderBy on `dueDate` is the same index shape regardless of
  // whether the equality side uses `==` or `in`. No new index required.
  async getCompletedTodosDueBetween(planId: string, params: TodoDueWindowQuery) {
    const todosQuery = queryByPlanCollection(
      getFirebaseFirestore(),
      planId,
      'todos',
      where('status', '==', 'done'),
      where('dueDate', '>=', Timestamp.fromDate(params.startAt)),
      where('dueDate', '<', Timestamp.fromDate(params.endAt)),
      orderBy('dueDate', 'asc'),
      limit(params.limitCount),
    );

    const snapshot = await getDocs(todosQuery);

    return snapshot.docs.map((item) => normalizeTodo(item.data() as TodoDocument));
  }
}
