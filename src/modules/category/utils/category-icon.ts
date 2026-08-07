import {
  Car,
  Gift,
  Heart,
  Home,
  Landmark,
  Music,
  Plane,
  Popcorn,
  Shirt,
  ShoppingBag,
  Sparkles,
  Tag,
  Ticket,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const KEYWORD_ICONS: { keywords: string[]; icon: LucideIcon }[] = [
  { keywords: ['an uong', 'am thuc', 'do uong'], icon: UtensilsCrossed },
  { keywords: ['di chuyen', 'xe', 'nhien lieu', 've tham quan', 've xe'], icon: Car },
  { keywords: ['may bay', 'du lich'], icon: Plane },
  { keywords: ['mua sam', 'qua tang', 'thiep'], icon: ShoppingBag },
  { keywords: ['khach san', 'dia diem', 'phong'], icon: Home },
  { keywords: ['trang phuc', 'trang diem'], icon: Shirt },
  { keywords: ['chup anh', 'quay phim'], icon: Ticket },
  { keywords: ['giai tri', 'am thanh', 'mc'], icon: Popcorn },
  { keywords: ['nhac', 'ca hat'], icon: Music },
  { keywords: ['trang tri'], icon: Sparkles },
  { keywords: ['cuoi', 'yeu'], icon: Heart },
  { keywords: ['qua', 'gift'], icon: Gift },
  { keywords: ['quy', 'nap quy', 'rut quy', 'tien lai', 'thu nhap', 'hoan tien'], icon: Landmark },
  { keywords: ['phi dich vu', 'chi phi'], icon: Wallet },
];

const DIACRITICS_PATTERN = new RegExp('[̀-ͯ]', 'g');

function normalize(value: string) {
  return value.toLowerCase().normalize('NFD').replace(DIACRITICS_PATTERN, '');
}

export function getCategoryIcon(name: string): LucideIcon {
  const normalized = normalize(name);
  const match = KEYWORD_ICONS.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword)),
  );

  return match?.icon ?? Tag;
}
