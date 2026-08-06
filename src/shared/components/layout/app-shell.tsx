'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { BarChart3, FolderKanban, UserCircle2 } from 'lucide-react';

import { useUserPlans } from '@/modules/plan/hooks/use-user-plans';
import { appRoutes } from '@/shared/constants';
import { cn } from '@/shared/utils/cn';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { plans } = useUserPlans();

  const mostRecentPlanId = plans[0]?.planId;
  const statisticHref = mostRecentPlanId ? `/plans/${mostRecentPlanId}?tab=statistic` : appRoutes.plans;
  const isStatisticActive = pathname.startsWith('/plans/') && searchParams.get('tab') === 'statistic';
  const isPlansActive = pathname.startsWith(appRoutes.plans) && !isStatisticActive;

  const navigationItems = [
    { href: appRoutes.plans, label: 'Kế hoạch', icon: FolderKanban, active: isPlansActive },
    { href: statisticHref, label: 'Thống kê', icon: BarChart3, active: isStatisticActive },
    { href: appRoutes.profile, label: 'Cá nhân', icon: UserCircle2, active: pathname === appRoutes.profile },
  ];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-28 pt-5 sm:px-6 lg:px-8">
      <div className="flex-1">{children}</div>
      <nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto max-w-3xl px-4 pt-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="pointer-events-auto grid grid-cols-3 rounded-[28px] border border-white/60 bg-slate-950/95 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.3)] backdrop-blur">
          {navigationItems.map(({ href, label, icon: Icon, active }) => (
            <Link
              key={label}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-1 rounded-[20px] text-[11px] font-medium text-slate-400 transition',
                active && 'bg-white/12 text-white',
              )}
              href={href}
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
