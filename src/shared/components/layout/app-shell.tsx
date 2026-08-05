'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { BarChart3, FolderKanban, Home, UserCircle2 } from 'lucide-react';

import { appRoutes } from '@/shared/constants';
import { cn } from '@/shared/utils/cn';

const navigationItems = [
  { href: appRoutes.home, label: 'Trang chủ', icon: Home },
  { href: appRoutes.plans, label: 'Kế hoạch', icon: FolderKanban },
  { href: appRoutes.plans, label: 'Thống kê', icon: BarChart3 },
  { href: appRoutes.profile, label: 'Cá nhân', icon: UserCircle2 },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-28 pt-5 sm:px-6 lg:px-8">
      <div className="flex-1">{children}</div>
      <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto max-w-3xl p-4">
        <div className="pointer-events-auto grid grid-cols-4 rounded-[28px] border border-white/60 bg-slate-950/95 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.3)] backdrop-blur">
          {navigationItems.map(({ href, label, icon: Icon }) => {
            const active =
              href === appRoutes.plans ? pathname.startsWith(appRoutes.plans) : pathname === href;

            return (
              <Link
                key={`${href}-${label}`}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 rounded-[20px] text-[11px] font-medium text-slate-400 transition',
                  active && 'bg-white/12 text-white',
                )}
                href={href}
              >
                <Icon className="size-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
