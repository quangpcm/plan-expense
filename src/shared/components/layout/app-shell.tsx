'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { FolderKanban, UserCircle2 } from 'lucide-react';

import { appRoutes } from '@/shared/constants';
import { cn } from '@/shared/utils/cn';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  const navigationItems = [
    { href: appRoutes.plans, label: 'Kế hoạch', icon: FolderKanban, active: pathname.startsWith(appRoutes.plans) },
    { href: appRoutes.profile, label: 'Cá nhân', icon: UserCircle2, active: pathname === appRoutes.profile },
  ];

  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-28 sm:px-6 lg:px-8"
      style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
    >
      <div className="flex-1">{children}</div>
      <nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto max-w-3xl px-3 pt-3 sm:px-4 sm:pt-4"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="pointer-events-auto grid grid-cols-2 rounded-[24px] border border-white/60 bg-slate-950/95 p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.3)] backdrop-blur sm:rounded-[28px] sm:p-2">
          {navigationItems.map(({ href, label, icon: Icon, active }) => (
            <Link
              key={label}
              className={cn(
                'flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-[18px] px-2 py-1.5 text-[10px] font-medium leading-none text-slate-400 transition sm:min-h-14 sm:gap-1 sm:rounded-[20px] sm:px-3 sm:py-2 sm:text-[11px]',
                active && 'bg-white/12 text-white',
              )}
              href={href}
            >
              <Icon className="size-[15px] sm:size-4" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
