import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import {
  isTimestampWithinRange,
  resolveDateRangeBounds,
  type DateRangeFilter,
} from '@/modules/debt-tracking/utils/date-range-presets';

const NOW = new Date(2026, 7, 20, 12, 0, 0); // 20/08/2026

function ts(year: number, month: number, day: number) {
  return Timestamp.fromDate(new Date(year, month, day, 12, 0, 0));
}

describe('resolveDateRangeBounds', () => {
  it('"all" has no bounds', () => {
    const bounds = resolveDateRangeBounds({ kind: 'preset', preset: 'all' }, NOW);

    expect(bounds.start).toBeNull();
    expect(bounds.end).toBeNull();
  });

  it('"this_month" starts at day 1 of the current month with no upper bound', () => {
    const bounds = resolveDateRangeBounds({ kind: 'preset', preset: 'this_month' }, NOW);

    expect(bounds.start).toEqual(new Date(2026, 7, 1, 0, 0, 0, 0));
    expect(bounds.end).toBeNull();
  });

  it('"last_month" is bounded on both ends so it excludes the current month', () => {
    const bounds = resolveDateRangeBounds({ kind: 'preset', preset: 'last_month' }, NOW);

    expect(bounds.start).toEqual(new Date(2026, 6, 1, 0, 0, 0, 0));
    expect(bounds.end).toEqual(new Date(2026, 7, 1, 0, 0, 0, 0));
  });

  it('custom range covers the full day at both ends', () => {
    const filter: DateRangeFilter = {
      kind: 'custom',
      from: new Date(2026, 0, 10, 9, 30),
      to: new Date(2026, 0, 15, 18, 0),
    };
    const bounds = resolveDateRangeBounds(filter, NOW);

    expect(bounds.start).toEqual(new Date(2026, 0, 10, 0, 0, 0, 0));
    expect(bounds.end).toEqual(new Date(2026, 0, 15, 23, 59, 59, 999));
  });
});

describe('isTimestampWithinRange', () => {
  it('keeps everything for "all"', () => {
    expect(isTimestampWithinRange(ts(2020, 0, 1), { kind: 'preset', preset: 'all' }, NOW)).toBe(true);
  });

  it('"last_month" excludes a transaction from the current month', () => {
    const filter: DateRangeFilter = { kind: 'preset', preset: 'last_month' };

    expect(isTimestampWithinRange(ts(2026, 6, 15), filter, NOW)).toBe(true);
    expect(isTimestampWithinRange(ts(2026, 7, 1), filter, NOW)).toBe(false);
    expect(isTimestampWithinRange(ts(2026, 5, 30), filter, NOW)).toBe(false);
  });

  it('"last_3_months" includes everything from 3 months ago up to now (no upper cap)', () => {
    const filter: DateRangeFilter = { kind: 'preset', preset: 'last_3_months' };

    expect(isTimestampWithinRange(ts(2026, 4, 20), filter, NOW)).toBe(true);
    expect(isTimestampWithinRange(ts(2026, 4, 19), filter, NOW)).toBe(false);
    expect(isTimestampWithinRange(ts(2026, 7, 20), filter, NOW)).toBe(true);
  });

  it('custom range is inclusive of both boundary days', () => {
    const filter: DateRangeFilter = {
      kind: 'custom',
      from: new Date(2026, 0, 10),
      to: new Date(2026, 0, 12),
    };

    expect(isTimestampWithinRange(ts(2026, 0, 10), filter, NOW)).toBe(true);
    expect(isTimestampWithinRange(ts(2026, 0, 12), filter, NOW)).toBe(true);
    expect(isTimestampWithinRange(ts(2026, 0, 9), filter, NOW)).toBe(false);
    expect(isTimestampWithinRange(ts(2026, 0, 13), filter, NOW)).toBe(false);
  });
});
