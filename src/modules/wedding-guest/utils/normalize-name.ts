const COMBINING_DIACRITICS_PATTERN = new RegExp('[\\u0300-\\u036f]', 'g');

export function normalizeVietnameseName(rawName: string): string {
  return rawName
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS_PATTERN, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}
