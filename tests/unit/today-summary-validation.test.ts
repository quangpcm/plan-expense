import { Timestamp } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';

import type { TodaySummaryDocument } from '@/modules/today/types/today-summary';
import { TODAY_SUMMARY_TTL_MS } from '@/modules/today/constants/today-summary.constants';
import type { TodaySummaryValidationSource } from '@/modules/today/utils/today-summary-validation';
import { validateTodaySummary } from '@/modules/today/utils/today-summary-validation';

const timezone = 'Asia/Ho_Chi_Minh';
const now = new Date('2026-08-26T03:00:00Z');
const dateKey = '2026-08-26';

function makeSummary(overrides: Partial<TodaySummaryDocument> = {}): TodaySummaryDocument {
  return {
    userId: 'user-1',
    dateKey,
    timezone,
    rebuiltAt: Timestamp.fromDate(now),
    sourcePlanIds: [],
    attentionItems: [],
    todayItems: [],
    upcomingItems: [],
    contexts: [],
    completedTodayCount: 0,
    totalTodayCount: 0,
    recentlyCompletedItems: [],
    ...overrides,
  };
}

function makeSource(overrides: Partial<TodaySummaryValidationSource> = {}): TodaySummaryValidationSource {
  return {
    getSummary: vi.fn(async () => null),
    rebuild: vi.fn(async () => makeSummary()),
    ...overrides,
  };
}

describe('validateTodaySummary', () => {
  it('returns the Firestore summary as-is when it is fresh, without rebuilding', async () => {
    const fresh = makeSummary({ rebuiltAt: Timestamp.fromMillis(now.getTime() - 1000) });
    const source = makeSource({ getSummary: vi.fn(async () => fresh) });

    const result = await validateTodaySummary(source, { userId: 'user-1', timezone, dateKey, now });

    expect(result).toBe(fresh);
    expect(source.rebuild).not.toHaveBeenCalled();
  });

  it('rebuilds when the Firestore summary is stale (TTL exceeded)', async () => {
    const stale = makeSummary({ rebuiltAt: Timestamp.fromMillis(now.getTime() - TODAY_SUMMARY_TTL_MS - 1) });
    const rebuilt = makeSummary({ sourcePlanIds: ['plan-1'] });
    const source = makeSource({ getSummary: vi.fn(async () => stale), rebuild: vi.fn(async () => rebuilt) });

    const result = await validateTodaySummary(source, { userId: 'user-1', timezone, dateKey, now });

    expect(result).toBe(rebuilt);
    expect(source.rebuild).toHaveBeenCalledTimes(1);
    expect(source.rebuild).toHaveBeenCalledWith('user-1', { now, timezone });
  });

  it('rebuilds when the Firestore summary is missing', async () => {
    const rebuilt = makeSummary();
    const source = makeSource({ getSummary: vi.fn(async () => null), rebuild: vi.fn(async () => rebuilt) });

    const result = await validateTodaySummary(source, { userId: 'user-1', timezone, dateKey, now });

    expect(result).toBe(rebuilt);
    expect(source.rebuild).toHaveBeenCalledTimes(1);
  });

  it('rebuilds when the stored dateKey has rolled over even if rebuiltAt is recent', async () => {
    const yesterday = makeSummary({ dateKey: '2026-08-25', rebuiltAt: Timestamp.fromMillis(now.getTime() - 1000) });
    const source = makeSource({ getSummary: vi.fn(async () => yesterday) });

    await validateTodaySummary(source, { userId: 'user-1', timezone, dateKey, now });

    expect(source.rebuild).toHaveBeenCalledTimes(1);
  });

  it('propagates a rebuild failure as a rejected promise (caller decides what to keep showing)', async () => {
    const failure = new Error('rebuild failed');
    const source = makeSource({
      getSummary: vi.fn(async () => null),
      rebuild: vi.fn(async () => {
        throw failure;
      }),
    });

    await expect(validateTodaySummary(source, { userId: 'user-1', timezone, dateKey, now })).rejects.toThrow(
      'rebuild failed',
    );
  });

  it('dedupes concurrent calls for the same (userId, dateKey): getSummary/rebuild each run once', async () => {
    let resolveGetSummary: (value: TodaySummaryDocument | null) => void = () => {};
    const getSummary = vi.fn(
      () =>
        new Promise<TodaySummaryDocument | null>((resolve) => {
          resolveGetSummary = resolve;
        }),
    );
    const rebuilt = makeSummary({ sourcePlanIds: ['deduped'] });
    const rebuild = vi.fn(async () => rebuilt);
    const source = makeSource({ getSummary, rebuild });

    const first = validateTodaySummary(source, { userId: 'user-1', timezone, dateKey, now });
    const second = validateTodaySummary(source, { userId: 'user-1', timezone, dateKey, now });

    resolveGetSummary(null);

    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult).toBe(rebuilt);
    expect(secondResult).toBe(rebuilt);
    expect(getSummary).toHaveBeenCalledTimes(1);
    expect(rebuild).toHaveBeenCalledTimes(1);
  });

  it('does not dedupe calls for different users, even for the same dateKey', async () => {
    const summaryA = makeSummary({ userId: 'user-a', rebuiltAt: Timestamp.fromMillis(now.getTime() - 1000) });
    const summaryB = makeSummary({ userId: 'user-b', rebuiltAt: Timestamp.fromMillis(now.getTime() - 1000) });
    const getSummary = vi.fn(async (userId: string) => (userId === 'user-a' ? summaryA : summaryB));
    const source = makeSource({ getSummary });

    await Promise.all([
      validateTodaySummary(source, { userId: 'user-a', timezone, dateKey, now }),
      validateTodaySummary(source, { userId: 'user-b', timezone, dateKey, now }),
    ]);

    expect(getSummary).toHaveBeenCalledTimes(2);
  });

  it('allows a new validation after a previous one for the same key has settled', async () => {
    const fresh = makeSummary({ rebuiltAt: Timestamp.fromMillis(now.getTime() - 1000) });
    const getSummary = vi.fn(async () => fresh);
    const source = makeSource({ getSummary });

    await validateTodaySummary(source, { userId: 'user-1', timezone, dateKey, now });
    await validateTodaySummary(source, { userId: 'user-1', timezone, dateKey, now });

    expect(getSummary).toHaveBeenCalledTimes(2);
  });
});
