import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import type { TodoStatus } from '@/modules/todo/types/todo';
import {
  MAX_ATTENTION_ITEMS,
  MAX_TODAY_ITEMS,
  MAX_UPCOMING_ITEMS,
} from '@/modules/today/constants/today-summary.constants';
import type {
  ActivitySourceItem,
  BuildTodaySummaryInput,
  TodoSourceItem,
} from '@/modules/today/utils/today-summary-bucketing';
import { buildTodaySummary } from '@/modules/today/utils/today-summary-bucketing';
import { getTodaySummaryWindows } from '@/modules/today/utils/today-summary-window';

const timezone = 'Asia/Ho_Chi_Minh';
const now = new Date('2026-08-26T03:00:00Z'); // 10:00 local, comfortably mid-day
const windows = getTodaySummaryWindows(now, timezone);

function ts(instant: Date | number): Timestamp {
  return Timestamp.fromDate(typeof instant === 'number' ? new Date(instant) : instant);
}

function makeTodo(overrides: Partial<TodoSourceItem> & { status?: TodoStatus }): TodoSourceItem {
  return {
    planId: 'plan-1',
    planName: 'Plan One',
    todoId: 'todo-1',
    title: 'A todo',
    dueDate: ts(windows.todayStart),
    status: 'todo',
    ...overrides,
  };
}

function makeActivity(overrides: Partial<ActivitySourceItem>): ActivitySourceItem {
  return {
    planId: 'plan-1',
    planName: 'Plan One',
    activityId: 'activity-1',
    title: 'An activity',
    startsAt: ts(windows.todayStart),
    ...overrides,
  };
}

function baseInput(overrides: Partial<BuildTodaySummaryInput> = {}): BuildTodaySummaryInput {
  return {
    userId: 'user-1',
    now,
    timezone,
    sourcePlanIds: ['plan-1'],
    overdueTodos: [],
    todayTodos: [],
    upcomingTodos: [],
    todayActivities: [],
    upcomingActivities: [],
    ...overrides,
  };
}

describe('buildTodaySummary — bucketing', () => {
  it('places an overdue active todo in attentionItems with urgency "overdue"', () => {
    const overdueDue = ts(windows.todayStart.getTime() - 1);
    const summary = buildTodaySummary(
      baseInput({ overdueTodos: [makeTodo({ todoId: 'overdue-1', dueDate: overdueDue })] }),
    );

    expect(summary.attentionItems).toHaveLength(1);
    expect(summary.attentionItems[0]).toMatchObject({ kind: 'todo', itemId: 'overdue-1', urgency: 'overdue' });
  });

  it('never places a Travel Activity in attentionItems (no overdue concept for activities)', () => {
    const summary = buildTodaySummary(
      baseInput({
        overdueTodos: [makeTodo({ todoId: 'overdue-1' })],
        todayActivities: [makeActivity({ activityId: 'today-activity' })],
      }),
    );

    expect(summary.attentionItems.every((item) => item.kind === 'todo')).toBe(true);
  });

  it('places todos due today and activities starting today in todayItems with urgency "danger"', () => {
    const summary = buildTodaySummary(
      baseInput({
        todayTodos: [makeTodo({ todoId: 'due-today' })],
        todayActivities: [makeActivity({ activityId: 'starts-today' })],
      }),
    );

    expect(summary.todayItems).toHaveLength(2);
    expect(summary.todayItems.every((item) => item.urgency === 'danger')).toBe(true);
    expect(summary.todayItems.map((item) => item.kind).sort()).toEqual(['todo', 'travelActivity']);
  });

  it('classifies upcoming items as "warning" within 2 days and "normal" beyond that', () => {
    const soon = ts(windows.tomorrowStart.getTime() + 1 * 24 * 60 * 60 * 1000); // tomorrow + 1 day = dayDiff 2
    const far = ts(windows.tomorrowStart.getTime() + 5 * 24 * 60 * 60 * 1000); // dayDiff 6
    const summary = buildTodaySummary(
      baseInput({
        upcomingTodos: [makeTodo({ todoId: 'soon', dueDate: soon }), makeTodo({ todoId: 'far', dueDate: far })],
      }),
    );

    const soonItem = summary.upcomingItems.find((item) => item.itemId === 'soon');
    const farItem = summary.upcomingItems.find((item) => item.itemId === 'far');

    expect(soonItem?.urgency).toBe('warning');
    expect(farItem?.urgency).toBe('normal');
  });

  it('applies the same upcoming urgency classification to Travel Activities', () => {
    const soon = ts(windows.tomorrowStart.getTime() + 1 * 24 * 60 * 60 * 1000);
    const summary = buildTodaySummary(baseInput({ upcomingActivities: [makeActivity({ startsAt: soon })] }));

    expect(summary.upcomingItems[0]?.urgency).toBe('warning');
  });
});

describe('buildTodaySummary — active status exclusion (defensive re-check)', () => {
  it('excludes done and cancelled todos even if present in the source arrays', () => {
    const summary = buildTodaySummary(
      baseInput({
        overdueTodos: [
          makeTodo({ todoId: 'still-active', status: 'in_progress', dueDate: ts(windows.todayStart.getTime() - 1) }),
          makeTodo({ todoId: 'done', status: 'done', dueDate: ts(windows.todayStart.getTime() - 1) }),
          makeTodo({ todoId: 'cancelled', status: 'cancelled', dueDate: ts(windows.todayStart.getTime() - 1) }),
        ],
      }),
    );

    expect(summary.attentionItems.map((item) => item.itemId)).toEqual(['still-active']);
  });
});

describe('buildTodaySummary — deterministic sorting', () => {
  it('sorts items chronologically, nearest due time first', () => {
    const summary = buildTodaySummary(
      baseInput({
        upcomingTodos: [
          makeTodo({ todoId: 'later', dueDate: ts(windows.upcomingEnd.getTime() - 1000) }),
          makeTodo({ todoId: 'sooner', dueDate: ts(windows.tomorrowStart) }),
        ],
      }),
    );

    expect(summary.upcomingItems.map((item) => item.itemId)).toEqual(['sooner', 'later']);
  });

  it('breaks ties on identical due timestamps by itemId, deterministically', () => {
    const sameInstant = ts(windows.todayStart);
    const summary = buildTodaySummary(
      baseInput({
        todayTodos: [
          makeTodo({ todoId: 'todo-b', dueDate: sameInstant }),
          makeTodo({ todoId: 'todo-a', dueDate: sameInstant }),
        ],
      }),
    );

    expect(summary.todayItems.map((item) => item.itemId)).toEqual(['todo-a', 'todo-b']);
  });
});

describe('buildTodaySummary — limits', () => {
  it('caps attentionItems at MAX_ATTENTION_ITEMS, keeping the most overdue (earliest due) ones', () => {
    const todos = Array.from({ length: MAX_ATTENTION_ITEMS + 2 }, (_, index) =>
      makeTodo({
        todoId: `overdue-${index}`,
        dueDate: ts(windows.todayStart.getTime() - (index + 1) * 60 * 60 * 1000),
      }),
    );
    const summary = buildTodaySummary(baseInput({ overdueTodos: todos }));

    expect(summary.attentionItems).toHaveLength(MAX_ATTENTION_ITEMS);
    // Ascending sort keeps the smallest (earliest/most overdue) timestamps first.
    expect(summary.attentionItems.map((item) => item.itemId)).toEqual([
      `overdue-${MAX_ATTENTION_ITEMS + 1}`,
      `overdue-${MAX_ATTENTION_ITEMS}`,
      `overdue-${MAX_ATTENTION_ITEMS - 1}`,
      `overdue-${MAX_ATTENTION_ITEMS - 2}`,
      `overdue-${MAX_ATTENTION_ITEMS - 3}`,
    ]);
  });

  it('caps todayItems at MAX_TODAY_ITEMS across combined todo + activity sources', () => {
    const todos = Array.from({ length: MAX_TODAY_ITEMS }, (_, index) => makeTodo({ todoId: `todo-${index}` }));
    const activities = Array.from({ length: MAX_TODAY_ITEMS }, (_, index) =>
      makeActivity({ activityId: `activity-${index}` }),
    );
    const summary = buildTodaySummary(baseInput({ todayTodos: todos, todayActivities: activities }));

    expect(summary.todayItems).toHaveLength(MAX_TODAY_ITEMS);
  });

  it('caps upcomingItems at MAX_UPCOMING_ITEMS', () => {
    const todos = Array.from({ length: MAX_UPCOMING_ITEMS + 3 }, (_, index) =>
      makeTodo({ todoId: `todo-${index}`, dueDate: ts(windows.tomorrowStart.getTime() + index * 60 * 60 * 1000) }),
    );
    const summary = buildTodaySummary(baseInput({ upcomingTodos: todos }));

    expect(summary.upcomingItems).toHaveLength(MAX_UPCOMING_ITEMS);
  });
});

describe('buildTodaySummary — duplicate prevention', () => {
  it('dedupes the same todo if it appears twice in a source array', () => {
    const todo = makeTodo({ todoId: 'dup-1', dueDate: ts(windows.todayStart.getTime() - 1) });
    const summary = buildTodaySummary(baseInput({ overdueTodos: [todo, { ...todo }] }));

    expect(summary.attentionItems).toHaveLength(1);
  });

  it('treats items with the same itemId but different planId as distinct', () => {
    const summary = buildTodaySummary(
      baseInput({
        overdueTodos: [
          makeTodo({ planId: 'plan-a', todoId: 'shared-id', dueDate: ts(windows.todayStart.getTime() - 1) }),
          makeTodo({ planId: 'plan-b', todoId: 'shared-id', dueDate: ts(windows.todayStart.getTime() - 2) }),
        ],
      }),
    );

    expect(summary.attentionItems).toHaveLength(2);
  });
});

describe('buildTodaySummary — write shape', () => {
  it('produces a fresh summary document shape with dateKey/timezone/rebuiltAt/sourcePlanIds', () => {
    const summary = buildTodaySummary(
      baseInput({ sourcePlanIds: ['plan-1', 'plan-2'], todayTodos: [makeTodo({ todoId: 'today-1' })] }),
    );

    expect(summary.userId).toBe('user-1');
    expect(summary.dateKey).toBe('2026-08-26');
    expect(summary.timezone).toBe(timezone);
    expect(summary.rebuiltAt.toMillis()).toBe(now.getTime());
    expect(summary.sourcePlanIds).toEqual(['plan-1', 'plan-2']);
    expect(summary.attentionItems).toEqual([]);
    expect(summary.todayItems).toHaveLength(1);
    expect(summary.upcomingItems).toEqual([]);
  });
});
