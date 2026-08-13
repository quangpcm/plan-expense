import type { LucideIcon } from 'lucide-react';
import { Briefcase, Cake, Folder, Gem, Home, PartyPopper, PiggyBank, Plane } from 'lucide-react';

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
    iconBgClassName: 'bg-[#64c4ff]',
    iconFgClassName: 'text-white',
    accentTextClassName: 'text-[#0c48d7]',
    progressTrackClassName: 'bg-[#e6f4ff]',
    progressFillClassName: 'bg-[#52aff4]',
  },
  wedding: {
    icon: Gem,
    iconBgClassName: 'bg-[#ffb5b0]',
    iconFgClassName: 'text-white',
    accentTextClassName: 'text-[#0c48d7]',
    progressTrackClassName: 'bg-[#ffe7e4]',
    progressFillClassName: 'bg-[#ff7f96]',
  },
  saving: {
    icon: PiggyBank,
    iconBgClassName: 'bg-[#42d8ba]',
    iconFgClassName: 'text-white',
    accentTextClassName: 'text-[#0c48d7]',
    progressTrackClassName: 'bg-[#ddfaf3]',
    progressFillClassName: 'bg-[#35cfaa]',
  },
  birthday: {
    icon: Cake,
    iconBgClassName: 'bg-[#d183ec]',
    iconFgClassName: 'text-white',
    accentTextClassName: 'text-[#0c48d7]',
    progressTrackClassName: 'bg-[#f3e6fb]',
    progressFillClassName: 'bg-[#bf70ec]',
  },
  event: {
    icon: PartyPopper,
    iconBgClassName: 'bg-[#8d8fff]',
    iconFgClassName: 'text-white',
    accentTextClassName: 'text-[#0c48d7]',
    progressTrackClassName: 'bg-[#e7e9ff]',
    progressFillClassName: 'bg-[#6f71ff]',
  },
  shared_living: {
    icon: Home,
    iconBgClassName: 'bg-[#ffbf7f]',
    iconFgClassName: 'text-white',
    accentTextClassName: 'text-[#0c48d7]',
    progressTrackClassName: 'bg-[#fff1df]',
    progressFillClassName: 'bg-[#ff9b38]',
  },
  project: {
    icon: Briefcase,
    iconBgClassName: 'bg-[#49c8c5]',
    iconFgClassName: 'text-white',
    accentTextClassName: 'text-[#0c48d7]',
    progressTrackClassName: 'bg-[#dff8f7]',
    progressFillClassName: 'bg-[#32b7b3]',
  },
  general: {
    icon: Folder,
    iconBgClassName: 'bg-[#b4bfd3]',
    iconFgClassName: 'text-white',
    accentTextClassName: 'text-[#0c48d7]',
    progressTrackClassName: 'bg-[#e9edf5]',
    progressFillClassName: 'bg-[#96a6c4]',
  },
};
