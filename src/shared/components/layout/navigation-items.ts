import { FolderKanban, UserCircle2, type LucideIcon } from 'lucide-react';

import { appRoutes } from '@/shared/constants';

export type AppNavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
};

export function getAppNavigationItems(pathname: string): AppNavigationItem[] {
  return [
    { href: appRoutes.plans, label: 'Kế hoạch', icon: FolderKanban, active: pathname.startsWith(appRoutes.plans) },
    { href: appRoutes.profile, label: 'Cá nhân', icon: UserCircle2, active: pathname === appRoutes.profile },
  ];
}
