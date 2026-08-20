import type { Timestamp } from 'firebase/firestore';

export type DateRangePresetKey =
  | 'all'
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'last_year';

export type DateRangeFilter =
  | { kind: 'preset'; preset: DateRangePresetKey }
  | { kind: 'custom'; from: Date; to: Date };

export const DEFAULT_DATE_RANGE_FILTER: DateRangeFilter = {
  kind: 'preset',
  preset: 'all',
};

export const dateRangePresetOptions: Array<{
  value: DateRangePresetKey;
  label: string;
}> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'this_month', label: 'Tháng này' },
  { value: 'last_month', label: 'Tháng trước' },
  { value: 'last_3_months', label: '3 tháng' },
  { value: 'last_6_months', label: '6 tháng' },
  { value: 'last_year', label: '1 năm' },
];

function startOfMonth(reference: Date, monthOffset = 0): Date {
  return new Date(
    reference.getFullYear(),
    reference.getMonth() + monthOffset,
    1,
    0,
    0,
    0,
    0,
  );
}

function startOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  );
}

function endOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

function subMonths(reference: Date, months: number): Date {
  return new Date(
    reference.getFullYear(),
    reference.getMonth() - months,
    reference.getDate(),
  );
}

function subYears(reference: Date, years: number): Date {
  return new Date(
    reference.getFullYear() - years,
    reference.getMonth(),
    reference.getDate(),
  );
}

type DateRangeBounds = { start: Date | null; end: Date | null };

// `end: null` nghĩa là không giới hạn trên (tới hiện tại) — dùng cho các preset dạng
// "N tháng/năm gần đây". Riêng "last_month" cần chặn trên ở đầu tháng này, nếu không sẽ
// gộp luôn giao dịch của tháng hiện tại.
export function resolveDateRangeBounds(
  filter: DateRangeFilter,
  now: Date,
): DateRangeBounds {
  if (filter.kind === 'custom') {
    return { start: startOfDay(filter.from), end: endOfDay(filter.to) };
  }

  switch (filter.preset) {
    case 'all':
      return { start: null, end: null };
    case 'this_month':
      return { start: startOfMonth(now), end: null };
    case 'last_month':
      return { start: startOfMonth(now, -1), end: startOfMonth(now) };
    case 'last_3_months':
      return { start: startOfDay(subMonths(now, 3)), end: null };
    case 'last_6_months':
      return { start: startOfDay(subMonths(now, 6)), end: null };
    case 'last_year':
      return { start: startOfDay(subYears(now, 1)), end: null };
    default:
      return { start: null, end: null };
  }
}

export function isTimestampWithinRange(
  occurredAt: Timestamp,
  filter: DateRangeFilter,
  now: Date,
): boolean {
  const { start, end } = resolveDateRangeBounds(filter, now);

  if (!start && !end) {
    return true;
  }

  const occurredAtMs = occurredAt.toMillis();

  if (start && occurredAtMs < start.getTime()) {
    return false;
  }

  if (end && occurredAtMs >= end.getTime()) {
    return false;
  }

  return true;
}
