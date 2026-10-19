import { type IconComponent, getIconifyIconComponent } from '@/shared/utils/iconify-icon';

// Ưu tiên bộ `flat-color-icons` (nhẹ, đã dùng sẵn); `round-pushpin`/`fork-and-knife-with-plate`
// không có trong bộ đó nên lấy từ `emojione` (xem src/shared/utils/iconify-icon.tsx).
const phoneIcon = getIconifyIconComponent('flat-color-icons:phone');
const paymentIcon = getIconifyIconComponent('flat-color-icons:money-transfer');
const bookingIcon = getIconifyIconComponent('flat-color-icons:calendar');
const transportIcon = getIconifyIconComponent('flat-color-icons:automotive');
const shoppingIcon = getIconifyIconComponent('flat-color-icons:shop');
const documentIcon = getIconifyIconComponent('flat-color-icons:document');
const peopleIcon = getIconifyIconComponent('flat-color-icons:collaboration');
const locationIcon = getIconifyIconComponent('emojione:round-pushpin');
const foodIcon = getIconifyIconComponent('emojione:fork-and-knife-with-plate');
const generalIcon = getIconifyIconComponent('flat-color-icons:todo-list');

export type TodoVisualCategory =
  | 'call'
  | 'payment'
  | 'booking'
  | 'transport'
  | 'shopping'
  | 'document'
  | 'people'
  | 'location'
  | 'food'
  | 'general';

type TodoVisualMetadata = {
  icon: IconComponent;
  iconClassName: string;
  backgroundClassName: string;
};

export const TODO_VISUAL_CATEGORY_META: Record<TodoVisualCategory, TodoVisualMetadata> = {
  call: {
    icon: phoneIcon,
    iconClassName: 'text-emerald-700 dark:text-emerald-300',
    backgroundClassName: 'bg-emerald-100 dark:bg-emerald-500/16',
  },
  payment: {
    icon: paymentIcon,
    iconClassName: 'text-amber-700 dark:text-amber-300',
    backgroundClassName: 'bg-amber-100 dark:bg-amber-500/16',
  },
  booking: {
    icon: bookingIcon,
    iconClassName: 'text-sky-700 dark:text-sky-300',
    backgroundClassName: 'bg-sky-100 dark:bg-sky-500/16',
  },
  transport: {
    icon: transportIcon,
    iconClassName: 'text-indigo-700 dark:text-indigo-300',
    backgroundClassName: 'bg-indigo-100 dark:bg-indigo-500/16',
  },
  shopping: {
    icon: shoppingIcon,
    iconClassName: 'text-fuchsia-700 dark:text-fuchsia-300',
    backgroundClassName: 'bg-fuchsia-100 dark:bg-fuchsia-500/16',
  },
  document: {
    icon: documentIcon,
    iconClassName: 'text-[var(--color-text-secondary)]',
    backgroundClassName: 'bg-[var(--color-surface-subtle)]',
  },
  people: {
    icon: peopleIcon,
    iconClassName: 'text-teal-700 dark:text-teal-300',
    backgroundClassName: 'bg-teal-100 dark:bg-teal-500/16',
  },
  location: {
    icon: locationIcon,
    iconClassName: 'text-rose-700 dark:text-rose-300',
    backgroundClassName: 'bg-rose-100 dark:bg-rose-500/16',
  },
  food: {
    icon: foodIcon,
    iconClassName: 'text-orange-700 dark:text-orange-300',
    backgroundClassName: 'bg-orange-100 dark:bg-orange-500/16',
  },
  general: {
    icon: generalIcon,
    iconClassName: 'text-[var(--color-text-secondary)]',
    backgroundClassName: 'bg-[var(--color-surface-subtle)]',
  },
};

const ACTION_RULES: Array<{ category: TodoVisualCategory; keywords: string[] }> = [
  { category: 'call', keywords: ['goi ', 'goi cho', 'goi dien', 'call ', 'lien he'] },
  { category: 'payment', keywords: ['thanh toan', 'tra tien', 'dong tien', 'chuyen khoan', 'ck '] },
  { category: 'booking', keywords: ['dat phong', 'dat ve', 'dat ban', 'booking', 'book '] },
  { category: 'transport', keywords: ['thue xe', 'dat xe', 'don xe', 'goi xe'] },
  { category: 'shopping', keywords: ['mua ', 'dat mua', 'shopping'] },
  { category: 'document', keywords: ['nop ', 'gui ', 'ky ', 'in ', 'scan ', 'photo cong chung'] },
  { category: 'people', keywords: ['moi ', 'chot danh sach', 'xac nhan khach'] },
  { category: 'location', keywords: ['tim ', 'den ', 'qua ', 'toi '] },
];

const NOUN_RULES: Array<{ category: TodoVisualCategory; keywords: string[] }> = [
  { category: 'transport', keywords: ['nha xe', 'xe khach', 'xe ', 'tau', 'san bay'] },
  { category: 'payment', keywords: ['tien', 'hoa don', 'phi', 'coc'] },
  { category: 'booking', keywords: ['khach san', 'homestay', 'phong', 'lich hen'] },
  { category: 'shopping', keywords: ['do ', 'qua ', 'quan ao', 'sieu thi'] },
  { category: 'document', keywords: ['giay to', 'ho so', 'hop dong', 'cccd', 'passport'] },
  { category: 'people', keywords: ['khach moi', 'doi tac', 'khach', 'nguoi'] },
  { category: 'location', keywords: ['can ho', 'dia diem', 'dia chi', 'nha '] },
  { category: 'food', keywords: ['an ', 'uong ', 'com', 'nha hang', 'quan an'] },
];

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function keywordToRegex(keyword: string): RegExp {
  const normalizedKeyword = keyword.trim().replace(/\s+/g, ' ');

  return new RegExp(`\\b${escapeRegex(normalizedKeyword).replace(/\s+/g, '\\s+')}\\b`);
}

function matchCategory(
  normalizedTitle: string,
  rules: Array<{ category: TodoVisualCategory; keywords: string[] }>,
): TodoVisualCategory | null {
  for (const rule of rules) {
    if (rule.keywords.some((keyword) => keywordToRegex(keyword).test(normalizedTitle))) {
      return rule.category;
    }
  }

  return null;
}

export function inferTodoVisualCategory(title: string): TodoVisualCategory {
  const normalizedTitle = normalizeTitle(title);

  return matchCategory(normalizedTitle, ACTION_RULES) ?? matchCategory(normalizedTitle, NOUN_RULES) ?? 'general';
}
