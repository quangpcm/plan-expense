import type { Timestamp } from 'firebase/firestore';

import type { TodoDocument } from '@/modules/todo/types/todo';

type TodoAggregateCounters = {
  todoCount?: number | null;
  completedTodoCount?: number | null;
  estimatedAmount?: number | null;
};

function toNonNegativeInt(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

export function buildTodoDeleteAggregateUpdate(
  counters: TodoAggregateCounters,
  todo: TodoDocument,
  estimatedAmount: number,
  updatedAt: Timestamp,
) {
  const nextTodoCount = Math.max(toNonNegativeInt(counters.todoCount) - 1, 0);
  const nextCompletedTodoCount = Math.max(
    toNonNegativeInt(counters.completedTodoCount) - (todo.status === 'done' ? 1 : 0),
    0,
  );
  const nextEstimatedAmount = Math.max(toNonNegativeInt(counters.estimatedAmount) - toNonNegativeInt(estimatedAmount), 0);

  return {
    todoCount: nextTodoCount,
    completedTodoCount: nextCompletedTodoCount,
    estimatedAmount: nextEstimatedAmount,
    updatedAt,
  };
}
