import type { LucideIcon } from 'lucide-react';
import {
  CalendarCheck,
  CarFront,
  FileText,
  ListChecks,
  MapPin,
  Phone,
  ShoppingBag,
  Users,
  UtensilsCrossed,
  WalletCards,
} from 'lucide-react';

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
  icon: LucideIcon;
  iconClassName: string;
  backgroundClassName: string;
};

export const TODO_VISUAL_CATEGORY_META: Record<TodoVisualCategory, TodoVisualMetadata> = {
  call: {
    icon: Phone,
    iconClassName: 'text-emerald-700',
    backgroundClassName: 'bg-emerald-100',
  },
  payment: {
    icon: WalletCards,
    iconClassName: 'text-amber-700',
    backgroundClassName: 'bg-amber-100',
  },
  booking: {
    icon: CalendarCheck,
    iconClassName: 'text-sky-700',
    backgroundClassName: 'bg-sky-100',
  },
  transport: {
    icon: CarFront,
    iconClassName: 'text-indigo-700',
    backgroundClassName: 'bg-indigo-100',
  },
  shopping: {
    icon: ShoppingBag,
    iconClassName: 'text-fuchsia-700',
    backgroundClassName: 'bg-fuchsia-100',
  },
  document: {
    icon: FileText,
    iconClassName: 'text-slate-700',
    backgroundClassName: 'bg-slate-100',
  },
  people: {
    icon: Users,
    iconClassName: 'text-teal-700',
    backgroundClassName: 'bg-teal-100',
  },
  location: {
    icon: MapPin,
    iconClassName: 'text-rose-700',
    backgroundClassName: 'bg-rose-100',
  },
  food: {
    icon: UtensilsCrossed,
    iconClassName: 'text-orange-700',
    backgroundClassName: 'bg-orange-100',
  },
  general: {
    icon: ListChecks,
    iconClassName: 'text-[var(--color-text-muted)]',
    backgroundClassName: 'bg-[var(--color-surface-default)]',
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
