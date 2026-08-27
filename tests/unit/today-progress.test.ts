import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import type { TodoStatus } from '@/modules/todo/types/todo';
import {
  buildRecentlyCompletedItems,
  buildTodayProgress,
  resolveTodayProgressCopy,
  type CompletedTodoSourceItem,
} from '@/modules/today/utils/today-progress';

function makeCompletedTodo(
  overrides: Partial<CompletedTodoSourceItem> & { status?: TodoStatus } = {},
): CompletedTodoSourceItem {
  return {
    planId: 'plan-1',
    planName: 'Plan One',
    todoId: 'todo-1',
    title: 'A completed todo',
    status: 'done',
    completedAt: Timestamp.fromMillis(1_700_000_000_000),
    ...overrides,
  };
}

describe('buildTodayProgress', () => {
  it('reports 0 completed out of N when nothing is done yet', () => {
    const progress = buildTodayProgress([], 7);

    expect(progress).toEqual({ completedTodayCount: 0, totalTodayCount: 7 });
  });

  it('reports a partial completion (denominator is completed + remaining, never remaining alone)', () => {
    const completed = [
      makeCompletedTodo({ todoId: 'todo-1' }),
      makeCompletedTodo({ todoId: 'todo-2' }),
      makeCompletedTodo({ todoId: 'todo-3' }),
    ];

    // 3 done + 4 still remaining must read "3/7", not "3/4".
    const progress = buildTodayProgress(completed, 4);

    expect(progress).toEqual({ completedTodayCount: 3, totalTodayCount: 7 });
  });

  it('reports all completed when nothing remains', () => {
    const completed = [makeCompletedTodo({ todoId: 'todo-1' }), makeCompletedTodo({ todoId: 'todo-2' })];

    const progress = buildTodayProgress(completed, 0);

    expect(progress).toEqual({ completedTodayCount: 2, totalTodayCount: 2 });
  });

  it('excludes cancelled todos even if present in the source array (defensive re-check)', () => {
    const items = [
      makeCompletedTodo({ todoId: 'done-1', status: 'done' }),
      makeCompletedTodo({ todoId: 'cancelled-1', status: 'cancelled' }),
    ];

    const progress = buildTodayProgress(items, 0);

    expect(progress.completedTodayCount).toBe(1);
  });

  it('dedupes the same todo if it appears twice in the source array', () => {
    const todo = makeCompletedTodo({ todoId: 'dup-1' });

    const progress = buildTodayProgress([todo, { ...todo }], 0);

    expect(progress.completedTodayCount).toBe(1);
  });

  it('treats items with the same todoId but different planId as distinct', () => {
    const progress = buildTodayProgress(
      [makeCompletedTodo({ planId: 'plan-a', todoId: 'shared-id' }), makeCompletedTodo({ planId: 'plan-b', todoId: 'shared-id' })],
      0,
    );

    expect(progress.completedTodayCount).toBe(2);
  });
});

describe('buildRecentlyCompletedItems', () => {
  it('orders newest completedAt first', () => {
    const older = makeCompletedTodo({ todoId: 'older', completedAt: Timestamp.fromMillis(1_700_000_000_000) });
    const newer = makeCompletedTodo({ todoId: 'newer', completedAt: Timestamp.fromMillis(1_700_100_000_000) });

    const items = buildRecentlyCompletedItems([older, newer]);

    expect(items.map((item) => item.todoId)).toEqual(['newer', 'older']);
  });

  it('caps at a maximum of 3 items', () => {
    const todos = Array.from({ length: 5 }, (_, index) =>
      makeCompletedTodo({ todoId: `todo-${index}`, completedAt: Timestamp.fromMillis(1_700_000_000_000 + index * 1000) }),
    );

    expect(buildRecentlyCompletedItems(todos)).toHaveLength(3);
  });

  it('excludes an item with no completedAt instead of inventing a timestamp', () => {
    const items = buildRecentlyCompletedItems([
      makeCompletedTodo({ todoId: 'has-timestamp' }),
      makeCompletedTodo({ todoId: 'missing-timestamp', completedAt: null }),
    ]);

    expect(items.map((item) => item.todoId)).toEqual(['has-timestamp']);
  });

  it('excludes cancelled todos even with a completedAt present', () => {
    const items = buildRecentlyCompletedItems([makeCompletedTodo({ todoId: 'cancelled-1', status: 'cancelled' })]);

    expect(items).toEqual([]);
  });

  it('preserves cross-plan items with their correct plan context', () => {
    const items = buildRecentlyCompletedItems([
      makeCompletedTodo({ planId: 'plan-a', planName: 'Đà Nẵng 2026', todoId: 'todo-a' }),
      makeCompletedTodo({
        planId: 'plan-b',
        planName: 'QP 💍 LA',
        todoId: 'todo-b',
        completedAt: Timestamp.fromMillis(1_700_100_000_000),
      }),
    ]);

    expect(items.map((item) => ({ planId: item.planId, planName: item.planName }))).toEqual([
      { planId: 'plan-b', planName: 'QP 💍 LA' },
      { planId: 'plan-a', planName: 'Đà Nẵng 2026' },
    ]);
  });

  it('breaks ties on identical completedAt timestamps by todoId, deterministically', () => {
    const sameInstant = Timestamp.fromMillis(1_700_000_000_000);

    const items = buildRecentlyCompletedItems([
      makeCompletedTodo({ todoId: 'todo-b', completedAt: sameInstant }),
      makeCompletedTodo({ todoId: 'todo-a', completedAt: sameInstant }),
    ]);

    expect(items.map((item) => item.todoId)).toEqual(['todo-a', 'todo-b']);
  });
});

describe('resolveTodayProgressCopy', () => {
  it('uses the "hôm nay" phrasing when nothing is completed yet', () => {
    expect(resolveTodayProgressCopy({ completedTodayCount: 0, totalTodayCount: 7 })).toBe(
      'Còn 7 việc cần xử lý hôm nay.',
    );
  });

  it('uses the shorter phrasing (no "hôm nay") once at least one item is done', () => {
    expect(resolveTodayProgressCopy({ completedTodayCount: 3, totalTodayCount: 7 })).toBe('Còn 4 việc cần xử lý.');
  });

  it('uses the celebratory copy when completed equals total', () => {
    expect(resolveTodayProgressCopy({ completedTodayCount: 5, totalTodayCount: 5 })).toBe(
      'Bạn đã hoàn thành mọi việc hôm nay. 🎉',
    );
  });
});
