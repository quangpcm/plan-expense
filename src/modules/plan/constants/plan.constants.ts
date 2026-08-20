import { Archive, Briefcase, Cake, CheckCircle2, Gem, HandCoins, Home, LayoutGrid, PartyPopper, PiggyBank, Plane, Radio, PauseCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { PlanStatus, PlanType } from '@/modules/plan/types/plan';

export const planTypeOptions: Array<{ value: PlanType; label: string }> = [
  { value: 'debt', label: 'Khoản vay' },
  { value: 'travel', label: 'Du lịch' },
  { value: 'wedding', label: 'Cưới hỏi' },
  { value: 'saving', label: 'Tiết kiệm' },
  { value: 'birthday', label: 'Sinh nhật' },
  { value: 'event', label: 'Sự kiện' },
  { value: 'shared_living', label: 'Sinh hoạt chung' },
  { value: 'project', label: 'Dự án / Hoạt động' },
  { value: 'general', label: 'Chung' },
];

export const planTypeIcons: Record<PlanType, LucideIcon> = {
  debt: HandCoins,
  travel: Plane,
  wedding: Gem,
  saving: PiggyBank,
  birthday: Cake,
  event: PartyPopper,
  shared_living: Home,
  project: Briefcase,
  general: LayoutGrid,
};

export const planTypeGradients: Record<PlanType, string> = {
  debt: 'bg-gradient-to-br from-amber-100 via-orange-50 to-white',
  travel: 'bg-gradient-to-br from-sky-100 via-cyan-50 to-white',
  wedding: 'bg-gradient-to-br from-rose-100 via-pink-50 to-white',
  saving: 'bg-gradient-to-br from-emerald-100 via-green-50 to-white',
  birthday: 'bg-gradient-to-br from-amber-100 via-yellow-50 to-white',
  event: 'bg-gradient-to-br from-violet-100 via-purple-50 to-white',
  shared_living: 'bg-gradient-to-br from-teal-100 via-emerald-50 to-white',
  project: 'bg-gradient-to-br from-indigo-100 via-blue-50 to-white',
  general: 'bg-gradient-to-br from-slate-100 via-slate-50 to-white',
};

export const planTypeBadgeColors: Record<PlanType, string> = {
  debt: 'bg-[#8a5a2b]',
  travel: 'bg-[var(--color-primary)]',
  saving: 'bg-[var(--color-primary)]',
  wedding: 'bg-[#4f5f7f]',
  shared_living: 'bg-[#4f5f7f]',
  birthday: 'bg-[#7c5d3b]',
  event: 'bg-[#5b6aa0]',
  project: 'bg-[#3f5f8f]',
  general: 'bg-[#5c677d]',
};

export const planStatusOptions: Array<{ value: PlanStatus; label: string; icon: LucideIcon }> = [
  { value: 'active', label: 'Đang chạy', icon: Radio },
  { value: 'completed', label: 'Hoàn thành', icon: CheckCircle2 },
  { value: 'closed', label: 'Dừng theo dõi', icon: PauseCircle },
  { value: 'archived', label: 'Lưu trữ', icon: Archive },
];

// Hardcoded so it's easy to tune later; archived plans past this many days
// are hard-deleted the next time the owner opens the archived plans list.
export const PLAN_ARCHIVE_RETENTION_DAYS = 15;
