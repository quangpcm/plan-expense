import type { Timestamp } from 'firebase/firestore';

import type { TodoStatus } from '@/modules/todo/types/todo';
import type { RecentlyCompletedItem } from '@/modules/today/types/today-summary';

// Only what Progress/Recently Completed need — not the full TodoDocument, same narrow-input
// pattern as TodoSourceItem/ActivitySourceItem. `completedAt` stays nullable: a completed Todo due
// today still counts toward completedTodayCount even if it predates the completedAt field, but it
// is never eligible for Recently Completed without one (see buildRecentlyCompletedItems below —
// no invented timestamp, no ordering by a field the domain doesn't guarantee, e.g. updatedAt).
// `status` is carried (even though the Firestore query already filters status=='done') for the
// same defensive-re-check-at-the-bucketing-boundary reason today-summary-bucketing.ts already
// applies to active Todos — testable without an emulator, and safe if a caller ever passes
// unfiltered data.
export type CompletedTodoSourceItem = {
  planId: string;
  planName: string;
  todoId: string;
  title: string;
  status: TodoStatus;
  completedAt: Timestamp | null;
};

const MAX_RECENTLY_COMPLETED_ITEMS = 3;

function isCompletedTodoSource(todo: CompletedTodoSourceItem): boolean {
  return todo.status === 'done';
}

function dedupeByPlanAndTodoId<T extends { planId: string; todoId: string }>(items: T[]): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.planId}:${item.todoId}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export type TodayProgress = {
  completedTodayCount: number;
  totalTodayCount: number;
};

// Deterministic supporting copy for TodayProgressCard (Phase 4.1) — no AI/LLM, a fixed 3-way
// cascade on the same completed/total numbers already computed above. Caller guarantees
// totalTodayCount > 0 (TodayProgressCard itself isn't rendered otherwise).
export function resolveTodayProgressCopy({ completedTodayCount, totalTodayCount }: TodayProgress): string {
  if (completedTodayCount === totalTodayCount) {
    return 'Bạn đã hoàn thành mọi việc hôm nay. 🎉';
  }

  if (completedTodayCount === 0) {
    return `Còn ${totalTodayCount} việc cần xử lý hôm nay.`;
  }

  return `Còn ${totalTodayCount - completedTodayCount} việc cần xử lý.`;
}

// Denominator is completedToday + remainingToday, never todayItems.length — the today-summary
// bucket only ever holds active (not-done) items, so counting just that array would silently
// shrink the denominator as things get completed throughout the day (e.g. 3 done + 4 remaining
// must read "3/7", not "3/4"). remainingTodayTodoCount is computed by the caller from the same
// active-today-todo source already used for the "Hôm nay" bucket (Todo-only — Travel Activity is
// explicitly out of scope for Progress V1).
export function buildTodayProgress(
  completedTodayTodos: CompletedTodoSourceItem[],
  remainingTodayTodoCount: number,
): TodayProgress {
  const completedTodayCount = dedupeByPlanAndTodoId(completedTodayTodos.filter(isCompletedTodoSource)).length;

  return {
    completedTodayCount,
    totalTodayCount: completedTodayCount + remainingTodayTodoCount,
  };
}

// Newest completedAt first, itemId as a deterministic tie-break (never random). Excludes any item
// without a real completedAt — a legacy/malformed Todo doc can't be placed in a recency-ordered
// list without inventing data the domain doesn't actually have.
export function buildRecentlyCompletedItems(completedTodayTodos: CompletedTodoSourceItem[]): RecentlyCompletedItem[] {
  return dedupeByPlanAndTodoId(completedTodayTodos.filter(isCompletedTodoSource))
    .filter((item): item is CompletedTodoSourceItem & { completedAt: Timestamp } => item.completedAt !== null)
    .sort((a, b) => {
      const diff = b.completedAt.toMillis() - a.completedAt.toMillis();

      return diff !== 0 ? diff : a.todoId.localeCompare(b.todoId);
    })
    .slice(0, MAX_RECENTLY_COMPLETED_ITEMS)
    .map((item) => ({
      planId: item.planId,
      planName: item.planName,
      todoId: item.todoId,
      title: item.title,
      completedAt: item.completedAt,
    }));
}
