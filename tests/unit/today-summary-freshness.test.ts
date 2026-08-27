import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import { TODAY_SUMMARY_TTL_MS } from '@/modules/today/constants/today-summary.constants';
import { getDateKey, isTodaySummaryFresh } from '@/modules/today/utils/today-summary-freshness';

describe('getDateKey', () => {
  it('formats a date as YYYY-MM-DD in the given timezone', () => {
    expect(getDateKey(new Date('2026-08-26T10:00:00Z'), 'Asia/Ho_Chi_Minh')).toBe('2026-08-26');
  });

  it('rolls over to the next day for a timezone ahead of UTC', () => {
    expect(getDateKey(new Date('2026-08-26T23:00:00Z'), 'Asia/Ho_Chi_Minh')).toBe('2026-08-27');
  });

  it('stays on the previous day for a timezone behind UTC', () => {
    expect(getDateKey(new Date('2026-08-26T02:00:00Z'), 'America/Los_Angeles')).toBe('2026-08-25');
  });
});

describe('isTodaySummaryFresh', () => {
  const timezone = 'Asia/Ho_Chi_Minh';
  const now = new Date('2026-08-26T10:00:00Z');

  it('is fresh when dateKey/timezone match and rebuiltAt is within TTL', () => {
    const summary = {
      dateKey: getDateKey(now, timezone),
      timezone,
      rebuiltAt: Timestamp.fromMillis(now.getTime() - TODAY_SUMMARY_TTL_MS / 2),
    };

    expect(isTodaySummaryFresh(summary, { now, timezone })).toBe(true);
  });

  it('is stale once rebuiltAt exceeds the TTL', () => {
    const summary = {
      dateKey: getDateKey(now, timezone),
      timezone,
      rebuiltAt: Timestamp.fromMillis(now.getTime() - TODAY_SUMMARY_TTL_MS - 1),
    };

    expect(isTodaySummaryFresh(summary, { now, timezone })).toBe(false);
  });

  it('is stale when the timezone differs', () => {
    const summary = {
      dateKey: getDateKey(now, timezone),
      timezone: 'America/Los_Angeles',
      rebuiltAt: Timestamp.fromMillis(now.getTime()),
    };

    expect(isTodaySummaryFresh(summary, { now, timezone })).toBe(false);
  });

  it('is stale when the day has rolled over', () => {
    const summary = {
      dateKey: '2026-08-25',
      timezone,
      rebuiltAt: Timestamp.fromMillis(now.getTime()),
    };

    expect(isTodaySummaryFresh(summary, { now, timezone })).toBe(false);
  });

  it('treats a rebuiltAt slightly in the future (clock skew) as fresh, not stale', () => {
    const summary = {
      dateKey: getDateKey(now, timezone),
      timezone,
      rebuiltAt: Timestamp.fromMillis(now.getTime() + 5_000),
    };

    expect(isTodaySummaryFresh(summary, { now, timezone })).toBe(true);
  });
});
