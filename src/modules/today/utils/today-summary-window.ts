import { UPCOMING_WINDOW_DAYS } from '@/modules/today/constants/today-summary.constants';
import { getDateKey } from '@/modules/today/utils/today-summary-freshness';

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Offset (ms) such that `instant.getTime() + offset` reproduces the same
// wall-clock numbers in UTC as `timeZone`'s local time at `instant`. No
// timezone library is available in this repo (see today-dashboard-specs.md),
// so this uses the same Intl.DateTimeFormat-only approach as getDateKey().
function getTimeZoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);

  const lookup = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  );

  const wallClockAsUtcMs = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    Number(lookup.hour),
    Number(lookup.minute),
    Number(lookup.second),
  );

  return wallClockAsUtcMs - instant.getTime();
}

// Start of the calendar day (in `timeZone`) that `instant` falls on,
// expressed as the actual UTC instant. Resolves the offset a second time
// using the naive midnight guess, so it's correct except in the rare case a
// DST transition happens between the naive guess and the true midnight.
export function zonedStartOfDayUtc(instant: Date, timeZone: string): Date {
  const dateKey = getDateKey(instant, timeZone);
  const parts = dateKey.split('-');
  // Number(undefined) is NaN, not a type error — getDateKey() always returns
  // 3 numeric parts, so this is just satisfying noUncheckedIndexedAccess,
  // not a real runtime possibility.
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const naiveMidnightUtcMs = Date.UTC(year, month - 1, day);
  const offsetMs = getTimeZoneOffsetMs(new Date(naiveMidnightUtcMs), timeZone);

  return new Date(naiveMidnightUtcMs - offsetMs);
}

export type TodaySummaryWindows = {
  todayStart: Date;
  tomorrowStart: Date;
  upcomingEnd: Date;
};

// Non-overlapping, adjacent windows: [todayStart, tomorrowStart) is "today",
// [tomorrowStart, upcomingEnd) is "upcoming". Boundaries never overlap by
// construction, so the same instant can never satisfy two windows.
export function getTodaySummaryWindows(now: Date, timezone: string): TodaySummaryWindows {
  const todayStart = zonedStartOfDayUtc(now, timezone);
  const tomorrowStart = new Date(todayStart.getTime() + ONE_DAY_MS);
  const upcomingEnd = new Date(tomorrowStart.getTime() + UPCOMING_WINDOW_DAYS * ONE_DAY_MS);

  return { todayStart, tomorrowStart, upcomingEnd };
}
