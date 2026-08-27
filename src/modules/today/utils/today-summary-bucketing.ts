import { Timestamp } from 'firebase/firestore';

import type { TodoPriority, TodoStatus } from '@/modules/todo/types/todo';
import {
  MAX_ATTENTION_ITEMS,
  MAX_TODAY_ITEMS,
  MAX_UPCOMING_ITEMS,
} from '@/modules/today/constants/today-summary.constants';
import type { TodaySummaryDocument, TodaySummaryItem } from '@/modules/today/types/today-summary';
import { buildTodayContexts, type TravelContextPlanInput } from '@/modules/today/utils/today-context';
import {
  buildRecentlyCompletedItems,
  buildTodayProgress,
  type CompletedTodoSourceItem,
} from '@/modules/today/utils/today-progress';
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
  priority: TodoPriority;
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
  // Phase 3 (Active Context) — plans eligible for a "Đang diễn ra" context card (Travel-only V1,
  // see today-context.ts). Defaults to [] so existing callers/tests that don't care about context
  // don't need updating.
  contextPlans?: TravelContextPlanInput[];
  // Phase 4 (Progress + Recently Completed) — Todos with status='done' and dueDate today
  // (Todo-only V1, see today-progress.ts). Defaults to [] for the same reason as contextPlans.
  completedTodayTodos?: CompletedTodoSourceItem[];
};

function isActiveTodoSource(todo: TodoSourceItem): boolean {
  return ACTIVE_TODO_STATUSES.includes(todo.status);
}

function countUniqueTodos(todos: TodoSourceItem[]): number {
  return new Set(todos.map((todo) => `${todo.planId}:${todo.todoId}`)).size;
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
    priority: source.priority,
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
    priority: null,
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

  // Uses the raw, uncapped input.todayActivities (not the deduped/capped todayItems above) so a
  // plan's "next activity today" can't be silently dropped by the global MAX_TODAY_ITEMS cap.
  const contexts = buildTodayContexts({
    plans: input.contextPlans ?? [],
    todayActivities: input.todayActivities,
    now: input.now,
    timezone: input.timezone,
  });

  // Progress denominator uses the raw, uncapped, active-today-Todo count (not todayItems.length,
  // which mixes in Travel Activity and is capped at MAX_TODAY_ITEMS) — see today-progress.ts.
  const completedTodayTodos = input.completedTodayTodos ?? [];
  const remainingTodayTodoCount = countUniqueTodos(input.todayTodos.filter(isActiveTodoSource));
  const { completedTodayCount, totalTodayCount } = buildTodayProgress(completedTodayTodos, remainingTodayTodoCount);
  const recentlyCompletedItems = buildRecentlyCompletedItems(completedTodayTodos);

  return {
    userId: input.userId,
    dateKey: getDateKey(input.now, input.timezone),
    timezone: input.timezone,
    rebuiltAt: Timestamp.fromDate(input.now),
    sourcePlanIds: input.sourcePlanIds,
    attentionItems,
    todayItems,
    upcomingItems,
    contexts,
    completedTodayCount,
    totalTodayCount,
    recentlyCompletedItems,
  };
}
