import { Cake, Gem, Home, LayoutGrid, PartyPopper, PiggyBank, Plane } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { PlanType } from '@/modules/plan/types/plan';

export const planTypeOptions: Array<{ value: PlanType; label: string }> = [
  { value: 'travel', label: 'Du lịch' },
  { value: 'wedding', label: 'Cưới hỏi' },
  { value: 'saving', label: 'Tiết kiệm' },
  { value: 'birthday', label: 'Sinh nhật' },
  { value: 'event', label: 'Sự kiện' },
  { value: 'shared_living', label: 'Sinh hoạt chung' },
  { value: 'general', label: 'Tổng hợp' },
];

export const planTypeIcons: Record<PlanType, LucideIcon> = {
  travel: Plane,
  wedding: Gem,
  saving: PiggyBank,
  birthday: Cake,
  event: PartyPopper,
  shared_living: Home,
  general: LayoutGrid,
};
