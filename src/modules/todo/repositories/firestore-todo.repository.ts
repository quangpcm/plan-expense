'use client';

import {
  Timestamp,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
} from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import type {
  AddTodoVendorPersistenceInput,
  CreateTodoPersistenceInput,
  TodoRepository,
} from '@/modules/todo/repositories/todo.repository';
import type { TodoDocument, TodoVendor, UpdateTodoInput } from '@/modules/todo/types/todo';
import { mapFirebaseError } from '@/shared/utils/firebase-error';

function normalizeTodo(raw: TodoDocument): TodoDocument {
  return {
    ...raw,
    budget: raw.budget ?? null,
    vendors: raw.vendors ?? [],
  };
}

export class FirestoreTodoRepository implements TodoRepository {
  async createTodo(input: CreateTodoPersistenceInput) {
    const db = getFirebaseFirestore();
    const todoRef = doc(collection(db, 'plans', input.planId, 'todos'));
    const planRef = doc(db, 'plans', input.planId);
    const milestoneRef = doc(db, 'plans', input.planId, 'milestones', input.milestoneId);
    const now = Timestamp.now();

    await runTransaction(db, async (transaction) => {
      transaction.set(todoRef, {
        id: todoRef.id,
        planId: input.planId,
        milestoneId: input.milestoneId,
        title: input.title,
        description: input.description,
        assigneeMemberId: input.assigneeMemberId,
        dueDate: input.dueDate ? Timestamp.fromDate(input.dueDate) : null,
        priority: input.priority,
        status: 'todo',
        budget: input.budget,
        vendors: [],
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

    return { todoId: todoRef.id };
  }

  async updateTodo(planId: string, input: UpdateTodoInput) {
    const db = getFirebaseFirestore();
    const todoRef = doc(db, 'plans', planId, 'todos', input.todoId);
    const planRef = doc(db, 'plans', planId);
    const milestoneRef = doc(db, 'plans', planId, 'milestones', input.milestoneId);
    const now = Timestamp.now();

    await runTransaction(db, async (transaction) => {
      const todoSnapshot = await transaction.get(todoRef);

      if (!todoSnapshot.exists()) {
        throw new Error('Todo not found.');
      }

      const previousTodo = todoSnapshot.data() as TodoDocument;
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
        updatedAt: now,
        completedAt: input.status === 'done' ? previousTodo.completedAt ?? now : null,
        cancelledAt: input.status === 'cancelled' ? previousTodo.cancelledAt ?? now : null,
      });

      transaction.update(planRef, {
        updatedAt: now,
      });

      transaction.update(milestoneRef, {
        completedTodoCount: increment(completedDelta),
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
        id: crypto.randomUUID(),
        name: vendor.name,
        link: vendor.link,
        price: vendor.price,
      };

      transaction.update(todoRef, {
        vendors: [...(previousTodo.vendors ?? []), newVendor],
        updatedAt: now,
      });
    });
  }

  async deleteTodo(planId: string, todoId: string) {
    const db = getFirebaseFirestore();
    const todoRef = doc(db, 'plans', planId, 'todos', todoId);
    const planRef = doc(db, 'plans', planId);
    const now = Timestamp.now();

    await runTransaction(db, async (transaction) => {
      const todoSnapshot = await transaction.get(todoRef);

      if (!todoSnapshot.exists()) {
        return;
      }

      const previousTodo = todoSnapshot.data() as TodoDocument;
      const milestoneRef = doc(db, 'plans', planId, 'milestones', previousTodo.milestoneId);

      transaction.delete(todoRef);

      transaction.update(planRef, {
        todoCount: increment(-1),
        updatedAt: now,
      });

      transaction.update(milestoneRef, {
        todoCount: increment(-1),
        completedTodoCount: increment(previousTodo.status === 'done' ? -1 : 0),
        updatedAt: now,
      });
    });
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
      orderBy('createdAt', 'desc'),
    );

    return onSnapshot(
      todosQuery,
      (snapshot) => {
        callback(
          snapshot.docs
            .map((item) => normalizeTodo(item.data() as TodoDocument))
            .filter((todo) => todo.milestoneId === milestoneId),
        );
      },
      (error) => {
        onError?.(mapFirebaseError(error, 'Unable to load todos for this milestone.', 'TODO_BY_MILESTONE_WATCH_FAILED'));
      },
    );
  }
}
