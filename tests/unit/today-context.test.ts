import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import type { PlanType } from '@/modules/plan/types/plan';
import type { ActivitySourceItem } from '@/modules/today/utils/today-summary-bucketing';
import { buildTodayContexts, type TravelContextPlanInput } from '@/modules/today/utils/today-context';

const timezone = 'Asia/Ho_Chi_Minh';
const now = new Date('2026-08-27T03:00:00Z'); // 10:00 local

function ts(dateOnly: string): Timestamp {
  return Timestamp.fromDate(new Date(dateOnly));
}

function makePlan(overrides: Partial<TravelContextPlanInput> & { planType?: PlanType } = {}): TravelContextPlanInput {
  return {
    planId: 'plan-1',
    planName: 'Đà Nẵng 2026',
    planType: 'travel',
    startDate: ts('2026-08-26'),
    endDate: ts('2026-08-29'),
    ...overrides,
  };
}

function makeActivity(overrides: Partial<ActivitySourceItem> = {}): ActivitySourceItem {
  return {
    planId: 'plan-1',
    planName: 'Đà Nẵng 2026',
    activityId: 'activity-1',
    title: 'Check-in khách sạn',
    startsAt: Timestamp.fromDate(now),
    ...overrides,
  };
}

describe('buildTodayContexts', () => {
  it('builds a travel context for a trip ongoing today, with the correct day index and date range', () => {
    const contexts = buildTodayContexts({ plans: [makePlan()], todayActivities: [], now, timezone });

    expect(contexts).toHaveLength(1);
    expect(contexts[0]).toMatchObject({ kind: 'travel', planId: 'plan-1', currentDay: 2, totalDays: 4 });
    expect(contexts[0]?.startDate.toMillis()).toBe(ts('2026-08-26').toMillis());
    expect(contexts[0]?.endDate.toMillis()).toBe(ts('2026-08-29').toMillis());
  });

  it('is a rest day (no activity at all today): nextActivity and remainingActivitiesToday both empty', () => {
    const contexts = buildTodayContexts({ plans: [makePlan()], todayActivities: [], now, timezone });

    expect(contexts[0]?.nextActivity).toBeNull();
    expect(contexts[0]?.remainingActivitiesToday).toBe(0);
  });

  it('counts remainingActivitiesToday from already-fetched data, including the picked nextActivity', () => {
    const later = makeActivity({
      activityId: 'later',
      startsAt: Timestamp.fromDate(new Date(now.getTime() + 4 * 60 * 60 * 1000)),
    });
    const sooner = makeActivity({
      activityId: 'sooner',
      startsAt: Timestamp.fromDate(new Date(now.getTime() + 1 * 60 * 60 * 1000)),
    });
    const past = makeActivity({
      activityId: 'past',
      startsAt: Timestamp.fromDate(new Date(now.getTime() - 60 * 60 * 1000)),
    });

    const contexts = buildTodayContexts({
      plans: [makePlan()],
      todayActivities: [later, past, sooner],
      now,
      timezone,
    });

    // 2 upcoming (later, sooner) — the already-passed one doesn't count as "remaining".
    expect(contexts[0]?.remainingActivitiesToday).toBe(2);
  });

  it('excludes a trip that has not started yet', () => {
    const plan = makePlan({ startDate: ts('2026-09-01'), endDate: ts('2026-09-05') });
    const contexts = buildTodayContexts({ plans: [plan], todayActivities: [], now, timezone });

    expect(contexts).toEqual([]);
  });

  it('excludes a trip that has already ended', () => {
    const plan = makePlan({ startDate: ts('2026-08-01'), endDate: ts('2026-08-10') });
    const contexts = buildTodayContexts({ plans: [plan], todayActivities: [], now, timezone });

    expect(contexts).toEqual([]);
  });

  it('excludes a non-travel plan even if its dates span today', () => {
    const plan = makePlan({ planType: 'wedding' });
    const contexts = buildTodayContexts({ plans: [plan], todayActivities: [], now, timezone });

    expect(contexts).toEqual([]);
  });

  it('excludes a plan missing startDate or endDate', () => {
    const contexts = buildTodayContexts({
      plans: [makePlan({ endDate: null })],
      todayActivities: [],
      now,
      timezone,
    });

    expect(contexts).toEqual([]);
  });

  it('picks the earliest upcoming activity today for that plan as nextActivity', () => {
    const later = makeActivity({
      activityId: 'later',
      title: 'Ăn tối',
      startsAt: Timestamp.fromDate(new Date(now.getTime() + 4 * 60 * 60 * 1000)),
    });
    const sooner = makeActivity({
      activityId: 'sooner',
      title: 'Check-in khách sạn',
      startsAt: Timestamp.fromDate(new Date(now.getTime() + 1 * 60 * 60 * 1000)),
    });
    const past = makeActivity({
      activityId: 'past',
      title: 'Đã xong',
      startsAt: Timestamp.fromDate(new Date(now.getTime() - 60 * 60 * 1000)),
    });

    const contexts = buildTodayContexts({
      plans: [makePlan()],
      todayActivities: [later, past, sooner],
      now,
      timezone,
    });

    expect(contexts[0]?.nextActivity?.title).toBe('Check-in khách sạn');
  });

  it('ignores activities belonging to a different plan', () => {
    const otherPlanActivity = makeActivity({ planId: 'plan-2', title: 'Not this trip' });

    const contexts = buildTodayContexts({
      plans: [makePlan()],
      todayActivities: [otherPlanActivity],
      now,
      timezone,
    });

    expect(contexts[0]?.nextActivity).toBeNull();
  });

  it('sets nextActivity to null when no activity remains today', () => {
    const contexts = buildTodayContexts({ plans: [makePlan()], todayActivities: [], now, timezone });

    expect(contexts[0]?.nextActivity).toBeNull();
  });

  it('caps at 2 contexts and ranks the trip with fewer days remaining first', () => {
    const endingSoon = makePlan({ planId: 'ending-soon', startDate: ts('2026-08-26'), endDate: ts('2026-08-27') });
    const justStarted = makePlan({ planId: 'just-started', startDate: ts('2026-08-27'), endDate: ts('2026-09-05') });
    const alsoOngoing = makePlan({ planId: 'also-ongoing', startDate: ts('2026-08-20'), endDate: ts('2026-08-30') });

    const contexts = buildTodayContexts({
      plans: [justStarted, alsoOngoing, endingSoon],
      todayActivities: [],
      now,
      timezone,
    });

    expect(contexts).toHaveLength(2);
    expect(contexts[0]?.planId).toBe('ending-soon');
  });

  it('breaks ties deterministically by planId, never randomly', () => {
    const planB = makePlan({ planId: 'plan-b' });
    const planA = makePlan({ planId: 'plan-a' });

    const contexts = buildTodayContexts({ plans: [planB, planA], todayActivities: [], now, timezone });

    expect(contexts.map((context) => context.planId)).toEqual(['plan-a', 'plan-b']);
  });

  it('returns an empty array when there are no plans', () => {
    expect(buildTodayContexts({ plans: [], todayActivities: [], now, timezone })).toEqual([]);
  });
});
