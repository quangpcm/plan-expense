type DateInput = Date | string | number;

export function formatDate(input: DateInput, locale = 'vi-VN') {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
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

