import { describe, expect, it } from 'vitest';

import { formatCompactDateRange } from '@/shared/utils/date';

// Intl.DateTimeFormat.formatRange surrounds its separator with U+2009 (thin space), not a regular
// space — this is the correct, locale-native ICU output, not a typo. Building expected strings
// with the literal thin-space escape keeps that precise instead of silently failing on
// Object.is-vs-visual-equality (a regular-space literal looks identical but isn't ===).
const THIN_SPACE = ' ';

function withThinSpaceDash(before: string, after: string): string {
  return `${before}${THIN_SPACE}–${THIN_SPACE}${after}`;
}

describe('formatCompactDateRange', () => {
  it('collapses a same-month, same-year range to "D – D tháng M"', () => {
    const result = formatCompactDateRange(new Date(2026, 7, 27), new Date(2026, 7, 29));

    expect(result).toBe(withThinSpaceDash('27', '29 tháng 8'));
  });

  it('formats a cross-month, same-year range with both month names, no year', () => {
    const result = formatCompactDateRange(new Date(2026, 7, 28), new Date(2026, 8, 2));

    expect(result).toBe(withThinSpaceDash('28 tháng 8', '2 tháng 9'));
  });

  it('formats a cross-year range with the year shown on both sides', () => {
    const result = formatCompactDateRange(new Date(2026, 11, 30), new Date(2027, 0, 2));

    expect(result).toBe(withThinSpaceDash('30 tháng 12, 2026', '2 tháng 1, 2027'));
  });

  it('accepts string/number DateInput the same as the other date utils', () => {
    // Noon UTC (not a bare date-only string) so this stays on the same calendar day regardless of
    // the test runner's local timezone offset — bare "2026-08-27" would parse as UTC midnight and
    // could roll back to the 26th in a timezone behind UTC, the same class of issue already
    // documented for Todo dueDate elsewhere in this module.
    const result = formatCompactDateRange('2026-08-27T12:00:00Z', '2026-08-29T12:00:00Z');

    expect(result).toBe(withThinSpaceDash('27', '29 tháng 8'));
  });
});
