import type { TodoDocument } from '@/modules/todo/types/todo';

export const TODO_ORDER_INDEX_STEP = 1000;

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
