import { CalendarDays, FolderKanban, type LucideIcon } from 'lucide-react';

import { appRoutes } from '@/shared/constants';

export type AppNavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
};

// "Cá nhân" is intentionally not a primary destination here — it's account/profile chrome, not a
// product-level workspace, so it lives in the header's account menu instead (see AccountMenu).
export function getAppNavigationItems(pathname: string): AppNavigationItem[] {
  return [
    { href: appRoutes.today, label: 'Hôm nay', icon: CalendarDays, active: pathname === appRoutes.today },
    { href: appRoutes.plans, label: 'Kế hoạch', icon: FolderKanban, active: pathname.startsWith(appRoutes.plans) },
  ];
}
