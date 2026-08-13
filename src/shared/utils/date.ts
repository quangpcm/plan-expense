type DateInput = Date | string | number;

export function formatDate(input: DateInput, locale = 'vi-VN') {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(input));
}

export function formatTime(input: DateInput, locale = 'vi-VN') {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(input));
}

export function formatDateTime(input: DateInput, locale = 'vi-VN') {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(input));
}

export function formatDateTimeLocalInput(input: DateInput) {
  const date = new Date(input);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const RELATIVE_TIME_DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
];

export function formatRelativeTime(input: DateInput, locale = 'vi-VN') {
  let duration = (new Date(input).getTime() - Date.now()) / 1000;

  for (const division of RELATIVE_TIME_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
        Math.round(duration),
        division.unit,
      );
    }

    duration /= division.amount;
  }

  return '';
}

export type DueUrgency = 'normal' | 'warning' | 'danger' | 'overdue';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDueDayDiff(input: DateInput) {
  return Math.round((startOfDay(new Date(input)).getTime() - startOfDay(new Date()).getTime()) / ONE_DAY_MS);
}

export function getDueUrgency(input: DateInput): DueUrgency {
  if (new Date(input).getTime() < Date.now()) return 'overdue';

  const dayDiff = getDueDayDiff(input);
  if (dayDiff <= 0) return 'danger';
  if (dayDiff <= 2) return 'warning';
  return 'normal';
}

export function formatDueCountdown(input: DateInput) {
  const diffMs = new Date(input).getTime() - Date.now();

  if (diffMs < 0) {
    const overdueMinutes = Math.floor(Math.abs(diffMs) / (60 * 1000));
    const overdueDays = Math.floor(overdueMinutes / (24 * 60));
    const overdueHours = Math.floor(overdueMinutes / 60);

    if (overdueDays > 0) return `Trễ ${overdueDays} ngày`;
    if (overdueHours > 0) return `Trễ ${overdueHours} giờ`;
    return `Trễ ${Math.max(overdueMinutes, 1)} phút`;
  }

  const dayDiff = getDueDayDiff(input);
  if (dayDiff >= 2) return `Còn ${dayDiff} ngày`;
  if (dayDiff === 1) return 'Ngày mai';

  const totalMinutes = Math.floor(diffMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours > 0 ? `Còn ${hours} giờ` : `Còn ${Math.max(minutes, 1)} phút`;
}
