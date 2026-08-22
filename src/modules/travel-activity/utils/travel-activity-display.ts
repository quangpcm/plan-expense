import { BedDouble, Landmark, MoreHorizontal, Plane, ShoppingBag, Ticket, UtensilsCrossed } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { TravelActivityCategory } from '@/modules/travel-activity/types/travel-activity';

export function toMapHref(url: string) {
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
}

type TravelActivityCategoryMeta = {
  value: TravelActivityCategory;
  label: string;
  icon: LucideIcon;
};

export const TRAVEL_ACTIVITY_CATEGORIES: TravelActivityCategoryMeta[] = [
  { value: 'transport', label: 'Di chuyển', icon: Plane },
  { value: 'stay', label: 'Lưu trú', icon: BedDouble },
  { value: 'food', label: 'Ăn uống', icon: UtensilsCrossed },
  { value: 'sightseeing', label: 'Tham quan', icon: Landmark },
  { value: 'activity', label: 'Hoạt động', icon: Ticket },
  { value: 'shopping', label: 'Mua sắm', icon: ShoppingBag },
  { value: 'other', label: 'Khác', icon: MoreHorizontal },
];

const TRAVEL_ACTIVITY_CATEGORY_FALLBACK = TRAVEL_ACTIVITY_CATEGORIES[TRAVEL_ACTIVITY_CATEGORIES.length - 1]!;

export function getTravelActivityCategoryMeta(category: TravelActivityCategory) {
  return (
    TRAVEL_ACTIVITY_CATEGORIES.find((entry) => entry.value === category) ??
    TRAVEL_ACTIVITY_CATEGORY_FALLBACK
  );
}
