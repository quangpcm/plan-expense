import { Timestamp } from 'firebase/firestore';

import type { TodoStatus } from '@/modules/todo/types/todo';
import {
  MAX_ATTENTION_ITEMS,
  MAX_TODAY_ITEMS,
  MAX_UPCOMING_ITEMS,
} from '@/modules/today/constants/today-summary.constants';
import type { TodaySummaryDocument, TodaySummaryItem } from '@/modules/today/types/today-summary';
import { getDateKey } from '@/modules/today/utils/today-summary-freshness';
import { ONE_DAY_MS, getTodaySummaryWindows, type TodaySummaryWindows } from '@/modules/today/utils/today-summary-window';
import type { DueUrgency } from '@/shared/utils/date';

// "Active" re-check at the bucketing boundary — the bounded repository
// queries already filter by status server-side; this is a defensive
// second check so the completed/cancelled exclusion rule holds even if a
// caller ever passes unfiltered data, and so it's unit-testable without an
// emulator (docs/today-dashboard-specs.md — Phase 2 test strategy).
const ACTIVE_TODO_STATUSES: TodoStatus[] = ['todo', 'in_progress'];

export type TodoSourceItem = {
  planId: string;
  planName: string;
  todoId: string;
  title: string;
  dueDate: Timestamp;
  status: TodoStatus;
};

export type ActivitySourceItem = {
  planId: string;
  planName: string;
  activityId: string;
  title: string;
  startsAt: Timestamp;
};

export type BuildTodaySummaryInput = {
  userId: string;
  now: Date;
  timezone: string;
  sourcePlanIds: string[];
  overdueTodos: TodoSourceItem[];
  todayTodos: TodoSourceItem[];
  upcomingTodos: TodoSourceItem[];
  todayActivities: ActivitySourceItem[];
  upcomingActivities: ActivitySourceItem[];
};

function isActiveTodoSource(todo: TodoSourceItem): boolean {
  return ACTIVE_TODO_STATUSES.includes(todo.status);
}

// Upcoming-only distinction (today/attention urgency is implied by which
// bucket a query already placed the item in — see callers below).
function resolveUpcomingUrgency(dueAt: Timestamp, windows: TodaySummaryWindows): DueUrgency {
  const dayDiff = Math.floor((dueAt.toMillis() - windows.todayStart.getTime()) / ONE_DAY_MS);

  return dayDiff <= 2 ? 'warning' : 'normal';
}

function toTodoSummaryItem(source: TodoSourceItem, urgency: DueUrgency): TodaySummaryItem {
  return {
    kind: 'todo',
    planId: source.planId,
    planName: source.planName,
    itemId: source.todoId,
    title: source.title,
    dueAt: source.dueDate,
    urgency,
  };
}

function toActivitySummaryItem(source: ActivitySourceItem, urgency: DueUrgency): TodaySummaryItem {
  return {
    kind: 'travelActivity',
    planId: source.planId,
    planName: source.planName,
    itemId: source.activityId,
    title: source.title,
    dueAt: source.startsAt,
    urgency,
  };
}

// Dedupes by (kind, planId, itemId) and sorts deterministically: nearest due
// time first, then itemId as a stable tiebreak for items sharing an exact
// instant (e.g. multiple todos defaulting to midnight with no time set).
function dedupeAndSort(items: TodaySummaryItem[]): TodaySummaryItem[] {
  const seen = new Set<string>();
  const unique = items.filter((item) => {
    const key = `${item.kind}:${item.planId}:${item.itemId}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  return unique.sort((a, b) => {
    const dueDiff = (a.dueAt?.toMillis() ?? 0) - (b.dueAt?.toMillis() ?? 0);

    return dueDiff !== 0 ? dueDiff : a.itemId.localeCompare(b.itemId);
  });
}

// Pure — no Firestore access. Given already-fetched, already permission-
// scoped source items plus the resolved time window, produces the final
// disposable read-model document (capped 5/10/5, deterministic order).
export function buildTodaySummary(input: BuildTodaySummaryInput): TodaySummaryDocument {
  const windows = getTodaySummaryWindows(input.now, input.timezone);

  const attentionItems = dedupeAndSort(
    input.overdueTodos.filter(isActiveTodoSource).map((todo) => toTodoSummaryItem(todo, 'overdue')),
  ).slice(0, MAX_ATTENTION_ITEMS);

  const todayItems = dedupeAndSort([
    ...input.todayTodos.filter(isActiveTodoSource).map((todo) => toTodoSummaryItem(todo, 'danger')),
    ...input.todayActivities.map((activity) => toActivitySummaryItem(activity, 'danger')),
  ]).slice(0, MAX_TODAY_ITEMS);

  const upcomingItems = dedupeAndSort([
    ...input.upcomingTodos
      .filter(isActiveTodoSource)
      .map((todo) => toTodoSummaryItem(todo, resolveUpcomingUrgency(todo.dueDate, windows))),
    ...input.upcomingActivities.map((activity) =>
      toActivitySummaryItem(activity, resolveUpcomingUrgency(activity.startsAt, windows)),
    ),
  ]).slice(0, MAX_UPCOMING_ITEMS);

  return {
    userId: input.userId,
    dateKey: getDateKey(input.now, input.timezone),
    timezone: input.timezone,
    rebuiltAt: Timestamp.fromDate(input.now),
    sourcePlanIds: input.sourcePlanIds,
    attentionItems,
    todayItems,
    upcomingItems,
  };
}
