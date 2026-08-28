import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import type { TodoDocument } from '@/modules/todo/types/todo';
import { buildTodoDeleteAggregateUpdate } from '@/modules/todo/utils/todo-aggregate';

const now = Timestamp.fromDate(new Date('2026-08-28T04:13:31.961Z'));

function createTodo(overrides: Partial<TodoDocument> = {}): TodoDocument {
  return {
    id: 'todo-1',
    planId: 'plan-1',
    milestoneId: 'milestone-1',
    orderIndex: 1,
    title: 'Todo',
    description: null,
    assigneeMemberId: null,
    dueDate: null,
    priority: 'medium',
    status: 'todo',
    budget: null,
    vendors: [],
    selectedTodoVendorId: null,
    attachments: [],
    createdByUserId: 'owner-user',
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    cancelledAt: null,
    ...overrides,
  };
}

describe('buildTodoDeleteAggregateUpdate', () => {
  it('clamps counters at zero when deleting a zero-budget todo', () => {
    const result = buildTodoDeleteAggregateUpdate(
      {
        todoCount: 0,
        completedTodoCount: 0,
        estimatedAmount: 0,
      },
      createTodo(),
      -0,
      now,
    );

    expect(result).toMatchObject({
      todoCount: 0,
      completedTodoCount: 0,
      estimatedAmount: 0,
      updatedAt: now,
    });
    expect(Object.is(result.estimatedAmount, -0)).toBe(false);
  });

  it('decrements done counters without going negative', () => {
    const result = buildTodoDeleteAggregateUpdate(
      {
        todoCount: 1,
        completedTodoCount: 1,
        estimatedAmount: 250000,
      },
      createTodo({ status: 'done' }),
      250000,
      now,
    );

    expect(result).toMatchObject({
      todoCount: 0,
      completedTodoCount: 0,
      estimatedAmount: 0,
      updatedAt: now,
    });
  });
});
