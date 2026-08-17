const PHAN_PER_CHI = 10;
const CHI_PER_LUONG = 10;
const PHAN_PER_LUONG = PHAN_PER_CHI * CHI_PER_LUONG;

export function formatGoldGift(amountInPhan: number): string {
  const safeAmount = Number.isFinite(amountInPhan)
    ? Math.trunc(amountInPhan)
    : 0;

  if (safeAmount <= 0) {
    return '0 phân';
  }

  const luong = Math.floor(safeAmount / PHAN_PER_LUONG);
  const chi = Math.floor((safeAmount % PHAN_PER_LUONG) / PHAN_PER_CHI);
  const phan = safeAmount % PHAN_PER_CHI;

  const parts: string[] = [];

  if (luong > 0) {
    parts.push(`${luong} lượng`);
  }

  if (chi > 0) {
    parts.push(`${chi} chỉ`);
  }

  if (phan > 0) {
    parts.push(`${phan} phân`);
  }

  return parts.join(' ');
}
