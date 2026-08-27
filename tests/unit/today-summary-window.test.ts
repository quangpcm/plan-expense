import { describe, expect, it } from 'vitest';

import {
  ONE_DAY_MS,
  getTodaySummaryWindows,
  zonedStartOfDayUtc,
} from '@/modules/today/utils/today-summary-window';
import { UPCOMING_WINDOW_DAYS } from '@/modules/today/constants/today-summary.constants';

describe('zonedStartOfDayUtc', () => {
  it('resolves local midnight for a timezone ahead of UTC (Asia/Ho_Chi_Minh, UTC+7)', () => {
    // 2026-08-26T10:00:00Z is 2026-08-26 17:00 in Vietnam; local midnight for
    // that calendar day is 2026-08-25T17:00:00Z.
    const start = zonedStartOfDayUtc(new Date('2026-08-26T10:00:00Z'), 'Asia/Ho_Chi_Minh');

    expect(start.toISOString()).toBe('2026-08-25T17:00:00.000Z');
  });

  it('resolves local midnight for a timezone behind UTC (America/Los_Angeles, UTC-7 in August/PDT)', () => {
    // 2026-08-26T02:00:00Z is 2026-08-25 19:00 in Los Angeles; local midnight
    // for that calendar day is 2026-08-25T07:00:00Z.
    const start = zonedStartOfDayUtc(new Date('2026-08-26T02:00:00Z'), 'America/Los_Angeles');

    expect(start.toISOString()).toBe('2026-08-25T07:00:00.000Z');
  });

  it('resolves local midnight for a timezone with no offset (UTC)', () => {
    const start = zonedStartOfDayUtc(new Date('2026-08-26T10:00:00Z'), 'UTC');

    expect(start.toISOString()).toBe('2026-08-26T00:00:00.000Z');
  });
});

describe('getTodaySummaryWindows', () => {
  const now = new Date('2026-08-26T03:00:00Z');
  const timezone = 'Asia/Ho_Chi_Minh';

  it('produces todayStart/tomorrowStart exactly one day apart', () => {
    const windows = getTodaySummaryWindows(now, timezone);

    expect(windows.tomorrowStart.getTime() - windows.todayStart.getTime()).toBe(ONE_DAY_MS);
  });

  it('produces upcomingEnd exactly UPCOMING_WINDOW_DAYS after tomorrowStart', () => {
    const windows = getTodaySummaryWindows(now, timezone);

    expect(windows.upcomingEnd.getTime() - windows.tomorrowStart.getTime()).toBe(
      UPCOMING_WINDOW_DAYS * ONE_DAY_MS,
    );
  });

  it('produces strictly increasing boundaries with `now` inside the today window', () => {
    const windows = getTodaySummaryWindows(now, timezone);

    expect(windows.todayStart.getTime()).toBeLessThan(windows.tomorrowStart.getTime());
    expect(windows.tomorrowStart.getTime()).toBeLessThan(windows.upcomingEnd.getTime());
    expect(windows.todayStart.getTime()).toBeLessThanOrEqual(now.getTime());
    expect(now.getTime()).toBeLessThan(windows.tomorrowStart.getTime());
  });

  it('never overlaps: an instant exactly at tomorrowStart belongs only to the upcoming window (today uses exclusive upper bound, upcoming uses inclusive lower bound)', () => {
    const windows = getTodaySummaryWindows(now, timezone);
    const boundaryInstant = windows.tomorrowStart.getTime();

    const belongsToToday = boundaryInstant >= windows.todayStart.getTime() && boundaryInstant < windows.tomorrowStart.getTime();
    const belongsToUpcoming = boundaryInstant >= windows.tomorrowStart.getTime() && boundaryInstant < windows.upcomingEnd.getTime();

    expect(belongsToToday).toBe(false);
    expect(belongsToUpcoming).toBe(true);
  });
});
