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

export const planTypeGradients: Record<PlanType, string> = {
  travel: 'bg-gradient-to-br from-sky-100 via-cyan-50 to-white',
  wedding: 'bg-gradient-to-br from-rose-100 via-pink-50 to-white',
  saving: 'bg-gradient-to-br from-emerald-100 via-green-50 to-white',
  birthday: 'bg-gradient-to-br from-amber-100 via-yellow-50 to-white',
  event: 'bg-gradient-to-br from-violet-100 via-purple-50 to-white',
  shared_living: 'bg-gradient-to-br from-teal-100 via-emerald-50 to-white',
  general: 'bg-gradient-to-br from-slate-100 via-slate-50 to-white',
};

export const planTypeBadgeColors: Record<PlanType, string> = {
  travel: 'bg-[var(--color-primary)]',
  saving: 'bg-[var(--color-primary)]',
  wedding: 'bg-[#4f5f7f]',
  shared_living: 'bg-[#4f5f7f]',
  birthday: 'bg-[#7c5d3b]',
  event: 'bg-[#5b6aa0]',
  general: 'bg-[#5c677d]',
};
