import type { Timestamp } from 'firebase/firestore';

import type { PlanType } from '@/modules/plan/types/plan';
import type { TodayContextItem } from '@/modules/today/types/today-summary';
import type { ActivitySourceItem } from '@/modules/today/utils/today-summary-bucketing';
import { getDateKey } from '@/modules/today/utils/today-summary-freshness';
import { ONE_DAY_MS } from '@/modules/today/utils/today-summary-window';

// Only the fields a context needs — not the full PlanSummary — same narrow-input pattern as
// TodoSourceItem/ActivitySourceItem, so this module doesn't couple to Plan's wider type.
export type TravelContextPlanInput = {
  planId: string;
  planName: string;
  planType: PlanType;
  startDate: Timestamp | null;
  endDate: Timestamp | null;
};

// V1 is Travel-only (docs/design-sys-v2/today-ui.md, Phase 4 scoping decision): Wedding has no
// dedicated wedding-date field (it would reuse the generic startDate as an undocumented
// assumption) and its "N/M việc quan trọng đã hoàn thành" ratio needs a new Firestore query that
// doesn't exist yet; Event plans have no time-of-day data captured at all (date-only, like Todo).
// Both are deferred until that data/semantics gap is resolved — not silently approximated here.
const MAX_CONTEXTS = 2;

function dayKeyToUtcMidnightMs(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);

  return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

// Day-key comparison (not a raw millisecond diff) so trip-day-index math agrees with the rest of
// Today's timezone handling (today-summary-window.ts) instead of drifting on partial-day offsets —
// the same reasoning already applied to Todo due-date bucketing.
function daysBetweenDateKeys(fromKey: string, toKey: string): number {
  return Math.round((dayKeyToUtcMidnightMs(toKey) - dayKeyToUtcMidnightMs(fromKey)) / ONE_DAY_MS);
}

function resolveTravelContext(
  plan: TravelContextPlanInput,
  todayActivities: ActivitySourceItem[],
  now: Date,
  timezone: string,
): TodayContextItem | null {
  if (plan.planType !== 'travel' || !plan.startDate || !plan.endDate) {
    return null;
  }

  const todayKey = getDateKey(now, timezone);
  const startKey = getDateKey(plan.startDate.toDate(), timezone);
  const endKey = getDateKey(plan.endDate.toDate(), timezone);

  const totalDays = daysBetweenDateKeys(startKey, endKey) + 1;
  const currentDay = daysBetweenDateKeys(startKey, todayKey) + 1;

  // Not temporally relevant today — trip hasn't started, has already ended, or has an invalid
  // (end before start) range.
  if (totalDays < 1 || currentDay < 1 || currentDay > totalDays) {
    return null;
  }

  // Rest-day support (Phase 3.1): every activity today for this plan that hasn't started yet, not
  // just the soonest one — remainingActivitiesToday lets the card distinguish "nothing left today"
  // from "one more thing after this," using data already fetched, no new query.
  const upcomingTodayActivities = [...todayActivities]
    .filter((activity) => activity.planId === plan.planId && activity.startsAt.toMillis() >= now.getTime())
    .sort((a, b) => a.startsAt.toMillis() - b.startsAt.toMillis());

  const nextActivity = upcomingTodayActivities[0];

  return {
    kind: 'travel',
    planId: plan.planId,
    planName: plan.planName,
    currentDay,
    totalDays,
    startDate: plan.startDate,
    endDate: plan.endDate,
    nextActivity: nextActivity ? { title: nextActivity.title, startsAt: nextActivity.startsAt } : null,
    remainingActivitiesToday: upcomingTodayActivities.length,
  };
}

// "Most relevant" tie-break: fewer days remaining in the trip first (closer to wrapping up reads
// as more time-sensitive), then planId for determinism — never random.
function compareContexts(a: TodayContextItem, b: TodayContextItem): number {
  const remainingDiff = a.totalDays - a.currentDay - (b.totalDays - b.currentDay);

  return remainingDiff !== 0 ? remainingDiff : a.planId.localeCompare(b.planId);
}

export type BuildTodayContextsInput = {
  plans: TravelContextPlanInput[];
  todayActivities: ActivitySourceItem[];
  now: Date;
  timezone: string;
};

// Pure — no Firestore access. A plan only produces a context card if it's genuinely ongoing today
// (docs/design-sys-v2/today-ui.md: "Một Plan chỉ tạo context card nếu nó thực sự có temporal
// relevance với hôm nay"). Capped at MAX_CONTEXTS — Active Context spotlights 1-2 plans, never a
// full list.
export function buildTodayContexts(input: BuildTodayContextsInput): TodayContextItem[] {
  const { plans, todayActivities, now, timezone } = input;

  return plans
    .map((plan) => resolveTravelContext(plan, todayActivities, now, timezone))
    .filter((context): context is TodayContextItem => context !== null)
    .sort(compareContexts)
    .slice(0, MAX_CONTEXTS);
}
