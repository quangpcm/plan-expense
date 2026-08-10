const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number) {
  return vndFormatter.format(amount);
}

export function formatAmountInputValue(value: number) {
  if (!value) {
    return '';
  }

  return Math.trunc(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseAmountInputValue(rawValue: string) {
  const digits = rawValue.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

