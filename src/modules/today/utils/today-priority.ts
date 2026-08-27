import type { TodaySummaryItem } from '@/modules/today/types/today-summary';
import { formatDueCountdown, formatTime } from '@/shared/utils/date';

// An Activity starting at or before this many minutes from now counts as "about to start" and is
// allowed to outrank a normal today Todo (docs/design-sys-v2/today-ui.md, Phase 2 ranking V1).
const ACTIVITY_IMMINENT_WINDOW_MINUTES = 60;

function getMinutesUntilStart(item: TodaySummaryItem, now: Date): number | null {
  if (!item.dueAt) {
    return null;
  }

  return (item.dueAt.toMillis() - now.getTime()) / (60 * 1000);
}

function isImminentActivity(item: TodaySummaryItem, now: Date): boolean {
  const minutesUntilStart = getMinutesUntilStart(item, now);

  return minutesUntilStart !== null && minutesUntilStart >= 0 && minutesUntilStart <= ACTIVITY_IMMINENT_WINDOW_MINUTES;
}

// Shared tie-break for every ranking step: dueAt ascending (earliest first — this reads as "most
// overdue first" for past-due items and "soonest first" for today/future items, so one comparator
// serves both semantics), then title, then itemId — deterministic, never random.
function compareDeterministically(a: TodaySummaryItem, b: TodaySummaryItem): number {
  const dueDiff = (a.dueAt?.toMillis() ?? 0) - (b.dueAt?.toMillis() ?? 0);

  if (dueDiff !== 0) {
    return dueDiff;
  }

  const titleDiff = a.title.localeCompare(b.title);

  return titleDiff !== 0 ? titleDiff : a.itemId.localeCompare(b.itemId);
}

function pickFirst(items: TodaySummaryItem[]): TodaySummaryItem | null {
  if (items.length === 0) {
    return null;
  }

  return [...items].sort(compareDeterministically)[0] ?? null;
}

type ResolveNextPriorityItemInput = {
  attentionItems: TodaySummaryItem[];
  todayItems: TodaySummaryItem[];
  now: Date;
};

// Deterministic "what should I do first" ranking (docs/design-sys-v2/today-ui.md, Phase 2 —
// Ranking V1). No AI/LLM, no scoring engine, no user-configurable weighting — a fixed cascade of
// rules checked in order, first non-empty group wins. Only attentionItems/todayItems are ever
// eligible; upcomingItems is intentionally out of scope (Priority never reaches past today).
export function resolveNextPriorityItem(input: ResolveNextPriorityItemInput): TodaySummaryItem | null {
  const { attentionItems, todayItems, now } = input;

  const overdueTodos = attentionItems.filter((item) => item.kind === 'todo');
  const todayTodos = todayItems.filter((item) => item.kind === 'todo');
  const todayActivities = todayItems.filter((item) => item.kind === 'travelActivity');

  // 1. Overdue Todo, priority = high
  const overdueHigh = pickFirst(overdueTodos.filter((item) => item.priority === 'high'));
  if (overdueHigh) {
    return overdueHigh;
  }

  // 2. Overdue Todo, longest overdue (any priority)
  const overdueAny = pickFirst(overdueTodos);
  if (overdueAny) {
    return overdueAny;
  }

  // 3. Today Todo, priority = high
  const todayHigh = pickFirst(todayTodos.filter((item) => item.priority === 'high'));
  if (todayHigh) {
    return todayHigh;
  }

  // 4. Travel Activity starting within 60 minutes — allowed to outrank a normal today Todo, but
  // never reaches this far if rule 1-3 already matched.
  const imminentActivity = pickFirst(todayActivities.filter((item) => isImminentActivity(item, now)));
  if (imminentActivity) {
    return imminentActivity;
  }

  // 5. Next Travel Activity today (any time)
  const nextActivity = pickFirst(todayActivities);
  if (nextActivity) {
    return nextActivity;
  }

  // 6. Remaining Todo today (any priority)
  const remainingToday = pickFirst(todayTodos);
  if (remainingToday) {
    return remainingToday;
  }

  return null;
}

export type PriorityUrgencyTone = 'neutral' | 'warning' | 'danger';

export type PriorityUrgency = {
  label: string;
  tone: PriorityUrgencyTone;
};

// Hero-specific copy — richer than TodayItemCard's compact badge (e.g. "Bắt đầu sau 35 phút"
// instead of a bare "14:30" time), since the hero's job is to answer "why this, right now?". This
// duplicates a small amount of the Todo urgency logic already in today-item-card.tsx's
// renderTodoStatus (2nd occurrence — observe, don't extract yet, per the Third-Use rule in
// docs/design-system/FeatureImplementationRules.md) because the Travel Activity half of the copy
// is genuinely different here and doesn't fit one shared function cleanly.
export function resolvePriorityUrgency(item: TodaySummaryItem, now: Date): PriorityUrgency | null {
  if (!item.dueAt) {
    return null;
  }

  if (item.kind === 'travelActivity') {
    if (isImminentActivity(item, now)) {
      const minutesUntilStart = Math.max(Math.round(getMinutesUntilStart(item, now) ?? 0), 1);

      return { label: `Bắt đầu sau ${minutesUntilStart} phút`, tone: 'warning' };
    }

    return { label: `Bắt đầu lúc ${formatTime(item.dueAt.toDate())}`, tone: 'neutral' };
  }

  // Todo — same date-only audit fix as today-item-card.tsx: the "Hôm nay" bucket never gets a
  // fabricated hour-based countdown, only genuine day-level lateness ("Trễ N ngày") does.
  if (item.urgency === 'danger') {
    return { label: 'Hôm nay', tone: 'neutral' };
  }

  return {
    label: formatDueCountdown(item.dueAt.toDate()),
    tone: item.urgency === 'overdue' ? 'danger' : 'neutral',
  };
}
