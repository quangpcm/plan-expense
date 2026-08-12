import type { TodoDocument } from '@/modules/todo/types/todo';

export const TODO_ORDER_INDEX_STEP = 1000;

export type TodoStatusFilter = 'pending' | 'done';
export type TodoDueSortOrder = 'oldest' | 'newest';

export function filterTodosByStatus<T extends Pick<TodoDocument, 'status'>>(
  todos: T[],
  filter: TodoStatusFilter,
): T[] {
  return todos.filter((todo) => (filter === 'done' ? todo.status === 'done' : todo.status !== 'done'));
}

export function sortTodosByDueDate<T extends Pick<TodoDocument, 'dueDate'>>(
  todos: T[],
  order: TodoDueSortOrder,
): T[] {
  return [...todos].sort((a, b) => {
    const aTime = a.dueDate ? a.dueDate.toMillis() : null;
    const bTime = b.dueDate ? b.dueDate.toMillis() : null;

    if (aTime === null && bTime === null) {
      return 0;
    }

    if (aTime === null) {
      return 1;
    }

    if (bTime === null) {
      return -1;
    }

    return order === 'oldest' ? aTime - bTime : bTime - aTime;
  });
}

export function getFallbackTodoOrderIndex(todo: Pick<TodoDocument, 'createdAt' | 'orderIndex'>) {
  if (Number.isFinite(todo.orderIndex)) {
    return todo.orderIndex;
  }

  return -(todo.createdAt?.toMillis?.() ?? 0);
}

export function sortTodosByMilestoneOrder<T extends Pick<TodoDocument, 'createdAt' | 'orderIndex'> & { id: string }>(
  todos: T[],
) {
  return [...todos].sort((a, b) => {
    const orderDifference = getFallbackTodoOrderIndex(a) - getFallbackTodoOrderIndex(b);

    if (orderDifference !== 0) {
      return orderDifference;
    }

    return a.createdAt.toMillis() - b.createdAt.toMillis();
  });
}
