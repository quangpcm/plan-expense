const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return vndFormatter.format(safeAmount);
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

function trimTrailingZero(value: number) {
  return Number(value.toFixed(1)).toString().replace('.', ',');
}

export function formatCompactCurrency(amount: number) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const abs = Math.abs(safeAmount);

  if (abs >= 1_000_000_000) {
    return `${trimTrailingZero(safeAmount / 1_000_000_000)} tỷ`;
  }

  if (abs >= 1_000_000) {
    return `${trimTrailingZero(safeAmount / 1_000_000)} triệu`;
  }

  if (abs >= 1_000) {
    return `${trimTrailingZero(safeAmount / 1_000)} nghìn`;
  }

  return formatCurrency(safeAmount);
}
