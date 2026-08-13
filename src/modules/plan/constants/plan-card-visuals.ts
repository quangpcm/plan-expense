import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Cake,
  Folder,
  Heart,
  Home,
  PiggyBank,
  Plane,
  Ticket,
} from 'lucide-react';

import type { PlanType } from '@/modules/plan/types/plan';

export type PlanCardVisual = {
  icon: LucideIcon;
  iconBgClassName: string;
  iconFgClassName: string;
  accentTextClassName: string;
  progressTrackClassName: string;
  progressFillClassName: string;
};

export const planCardVisualsByType: Record<PlanType, PlanCardVisual> = {
  travel: {
    icon: Plane,
    iconBgClassName: 'bg-gradient-to-br from-blue-400 to-cyan-300',
    iconFgClassName: 'text-white',
    accentTextClassName: 'text-[#0c48d7]',
    progressTrackClassName: 'bg-[#eceef0]',
    progressFillClassName: 'bg-[#60a5fa]',
  },
  wedding: {
    icon: Heart,
    iconBgClassName: 'bg-gradient-to-br from-rose-300 to-orange-200',
    iconFgClassName: 'text-white',
    accentTextClassName: 'text-[#0c48d7]',
    progressTrackClassName: 'bg-[#eceef0]',
    progressFillClassName: 'bg-[#fb7185]',
  },
  saving: {
    icon: PiggyBank,
    iconBgClassName: 'bg-gradient-to-br from-emerald-400 to-teal-300',
    iconFgClassName: 'text-white',
    accentTextClassName: 'text-[#0c48d7]',
    progressTrackClassName: 'bg-[#eceef0]',
    progressFillClassName: 'bg-[#34d399]',
  },
  birthday: {
    icon: Cake,
    iconBgClassName: 'bg-gradient-to-br from-purple-400 to-pink-400',
    iconFgClassName: 'text-white',
    accentTextClassName: 'text-[#0c48d7]',
    progressTrackClassName: 'bg-[#eceef0]',
    progressFillClassName: 'bg-purple-400',
  },
  event: {
    icon: Ticket,
    iconBgClassName: 'bg-gradient-to-br from-indigo-500 to-blue-900',
    iconFgClassName: 'text-white',
    accentTextClassName: 'text-[#0c48d7]',
    progressTrackClassName: 'bg-[#eceef0]',
    progressFillClassName: 'bg-indigo-500',
  },
  shared_living: {
    icon: Home,
    iconBgClassName: 'bg-gradient-to-br from-orange-400 to-red-400',
    iconFgClassName: 'text-white',
    accentTextClassName: 'text-[#0c48d7]',
    progressTrackClassName: 'bg-[#eceef0]',
    progressFillClassName: 'bg-[#fb923c]',
  },
  project: {
    icon: Briefcase,
    iconBgClassName: 'bg-gradient-to-br from-teal-500 to-slate-400',
    iconFgClassName: 'text-white',
    accentTextClassName: 'text-[#0c48d7]',
    progressTrackClassName: 'bg-[#eceef0]',
    progressFillClassName: 'bg-[#14b8a6]',
  },
  general: {
    icon: Folder,
    iconBgClassName: 'bg-gradient-to-br from-slate-400 to-gray-300',
    iconFgClassName: 'text-white',
    accentTextClassName: 'text-[#0c48d7]',
    progressTrackClassName: 'bg-[#eceef0]',
    progressFillClassName: 'bg-slate-500',
  },
};
