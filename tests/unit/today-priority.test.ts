import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import type { TodoPriority } from '@/modules/todo/types/todo';
import type { TodaySummaryItem } from '@/modules/today/types/today-summary';
import { resolveNextPriorityItem, resolvePriorityUrgency } from '@/modules/today/utils/today-priority';

const now = new Date('2026-08-27T03:00:00Z'); // 10:00 Asia/Ho_Chi_Minh

function ts(instant: Date | number): Timestamp {
  return Timestamp.fromDate(typeof instant === 'number' ? new Date(instant) : instant);
}

function makeTodo(overrides: Partial<TodaySummaryItem> & { priority?: TodoPriority } = {}): TodaySummaryItem {
  return {
    kind: 'todo',
    planId: 'plan-1',
    planName: 'Plan One',
    itemId: 'todo-1',
    title: 'A todo',
    dueAt: ts(now),
    urgency: 'danger',
    priority: 'medium',
    ...overrides,
  };
}

function makeActivity(overrides: Partial<TodaySummaryItem> = {}): TodaySummaryItem {
  return {
    kind: 'travelActivity',
    planId: 'plan-1',
    planName: 'Plan One',
    itemId: 'activity-1',
    title: 'An activity',
    dueAt: ts(now),
    urgency: 'danger',
    priority: null,
    ...overrides,
  };
}

describe('resolveNextPriorityItem', () => {
  it('picks an overdue high-priority todo over an overdue normal todo', () => {
    const overdueHigh = makeTodo({ itemId: 'overdue-high', priority: 'high', urgency: 'overdue' });
    const overdueNormal = makeTodo({ itemId: 'overdue-normal', priority: 'medium', urgency: 'overdue' });

    const result = resolveNextPriorityItem({
      attentionItems: [overdueNormal, overdueHigh],
      todayItems: [],
      now,
    });

    expect(result?.itemId).toBe('overdue-high');
  });

  it('picks an overdue normal todo over a today high-priority todo', () => {
    const overdueNormal = makeTodo({ itemId: 'overdue-normal', priority: 'medium', urgency: 'overdue' });
    const todayHigh = makeTodo({ itemId: 'today-high', priority: 'high', urgency: 'danger' });

    const result = resolveNextPriorityItem({
      attentionItems: [overdueNormal],
      todayItems: [todayHigh],
      now,
    });

    expect(result?.itemId).toBe('overdue-normal');
  });

  it('picks a today high-priority todo over a normal today todo', () => {
    const todayHigh = makeTodo({ itemId: 'today-high', priority: 'high', urgency: 'danger' });
    const todayNormal = makeTodo({ itemId: 'today-normal', priority: 'low', urgency: 'danger' });

    const result = resolveNextPriorityItem({
      attentionItems: [],
      todayItems: [todayNormal, todayHigh],
      now,
    });

    expect(result?.itemId).toBe('today-high');
  });

  it('lets an activity starting within 60 minutes outrank a normal today todo', () => {
    const imminentActivity = makeActivity({
      itemId: 'imminent-activity',
      dueAt: ts(now.getTime() + 35 * 60 * 1000),
    });
    const todayNormal = makeTodo({ itemId: 'today-normal', priority: 'medium', urgency: 'danger' });

    const result = resolveNextPriorityItem({
      attentionItems: [],
      todayItems: [todayNormal, imminentActivity],
      now,
    });

    expect(result?.itemId).toBe('imminent-activity');
  });

  it('does not let an activity starting within 60 minutes outrank an overdue high-priority todo', () => {
    const imminentActivity = makeActivity({
      itemId: 'imminent-activity',
      dueAt: ts(now.getTime() + 10 * 60 * 1000),
    });
    const overdueHigh = makeTodo({ itemId: 'overdue-high', priority: 'high', urgency: 'overdue' });

    const result = resolveNextPriorityItem({
      attentionItems: [overdueHigh],
      todayItems: [imminentActivity],
      now,
    });

    expect(result?.itemId).toBe('overdue-high');
  });

  it('orders the "next activity today" fallback by nearest start time', () => {
    const later = makeActivity({ itemId: 'later', dueAt: ts(now.getTime() + 5 * 60 * 60 * 1000) });
    const sooner = makeActivity({ itemId: 'sooner', dueAt: ts(now.getTime() + 3 * 60 * 60 * 1000) });

    const result = resolveNextPriorityItem({
      attentionItems: [],
      todayItems: [later, sooner],
      now,
    });

    expect(result?.itemId).toBe('sooner');
  });

  it('breaks ties deterministically by title then itemId, never randomly', () => {
    const sameInstant = ts(now);
    const a = makeTodo({ itemId: 'todo-b', title: 'Zebra', priority: 'high', urgency: 'overdue', dueAt: sameInstant });
    const b = makeTodo({ itemId: 'todo-a', title: 'Apple', priority: 'high', urgency: 'overdue', dueAt: sameInstant });

    const result = resolveNextPriorityItem({ attentionItems: [a, b], todayItems: [], now });

    expect(result?.itemId).toBe('todo-a');
  });

  it('returns null when there is nothing eligible in attention or today', () => {
    const result = resolveNextPriorityItem({ attentionItems: [], todayItems: [], now });

    expect(result).toBeNull();
  });

  it('never selects an item that is only present in upcoming (out of scope by construction)', () => {
    // resolveNextPriorityItem's signature only accepts attentionItems/todayItems — an upcoming-only
    // item structurally cannot be passed in, so this documents the contract: passing empty
    // attention/today never falls through to "pick anything," even if the caller has upcoming data
    // elsewhere.
    const result = resolveNextPriorityItem({ attentionItems: [], todayItems: [], now });

    expect(result).toBeNull();
  });

  it('falls back to the remaining today todo when no other rule matches', () => {
    const todayNormal = makeTodo({ itemId: 'today-normal', priority: 'low', urgency: 'danger' });

    const result = resolveNextPriorityItem({ attentionItems: [], todayItems: [todayNormal], now });

    expect(result?.itemId).toBe('today-normal');
  });
});

describe('resolvePriorityUrgency', () => {
  it('labels a today todo as "Hôm nay" instead of a fabricated hour-based countdown', () => {
    const todo = makeTodo({ urgency: 'danger', dueAt: ts(now) });

    expect(resolvePriorityUrgency(todo, now)).toEqual({ label: 'Hôm nay', tone: 'neutral' });
  });

  it('labels an overdue todo with day-level lateness', () => {
    const todo = makeTodo({ urgency: 'overdue', dueAt: ts(now.getTime() - 25 * 60 * 60 * 1000) });

    expect(resolvePriorityUrgency(todo, now)).toEqual({ label: 'Trễ 1 ngày', tone: 'danger' });
  });

  it('labels an imminent activity with a relative minute countdown', () => {
    const activity = makeActivity({ dueAt: ts(now.getTime() + 35 * 60 * 1000) });

    expect(resolvePriorityUrgency(activity, now)).toEqual({ label: 'Bắt đầu sau 35 phút', tone: 'warning' });
  });

  it('labels a non-imminent activity with an absolute time', () => {
    const activity = makeActivity({ dueAt: ts(now.getTime() + 3 * 60 * 60 * 1000) });
    const result = resolvePriorityUrgency(activity, now);

    expect(result?.tone).toBe('neutral');
    expect(result?.label.startsWith('Bắt đầu lúc ')).toBe(true);
  });
});
