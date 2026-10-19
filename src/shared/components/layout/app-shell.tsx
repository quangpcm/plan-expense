'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { AppBottomNav } from '@/shared/components/layout/app-bottom-nav';
import { AppHeader } from '@/shared/components/layout/app-header';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isTodayRoute = pathname === '/today';

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-surface-page)]">
      <AppHeader />
      <div
        className={
          isTodayRoute
            ? 'mx-auto w-full max-w-[1500px] flex-1 pb-[calc(4.5rem_+_env(safe-area-inset-bottom))] md:pb-8'
            : 'mx-auto w-full max-w-[1500px] flex-1 px-4 pb-[calc(4.5rem_+_env(safe-area-inset-bottom))] pt-5 sm:px-6 md:pb-8 lg:px-6'
        }
      >
        {children}
      </div>
      <AppBottomNav />
    </div>
  );
}
