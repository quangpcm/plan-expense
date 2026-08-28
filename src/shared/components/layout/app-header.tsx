'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { PlansAttentionBell } from '@/modules/todo/components/plans-attention-bell';
import { AccountMenu } from '@/shared/components/layout/account-menu';
import { getAppNavigationItems } from '@/shared/components/layout/navigation-items';
import { cn } from '@/shared/utils/cn';

export function AppHeader() {
  const pathname = usePathname();
  const navigationItems = getAppNavigationItems(pathname);

  return (
    <header className="sticky top-0 z-[var(--z-index-sticky)] border-b border-[var(--color-border-subtle)] bg-[color-mix(in_srgb,var(--color-surface-default)_94%,transparent)] text-[var(--color-text-primary)] backdrop-blur">
      <div
        className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-6"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingBottom: '0.75rem' }}
      >
        <div className="flex min-w-0 items-center gap-6">
          <Image
            alt="Go Plan"
            className="h-9 w-auto shrink-0"
            height={44}
            priority
            src="/icons/app/app-header-logo.png"
            width={180}
          />

          <nav className="hidden items-center gap-1 md:flex">
            {navigationItems.map(({ href, label, icon: Icon, active }) => (
              <Link
                className={cn(
                  'flex min-h-11 items-center gap-2 px-3 text-sm font-medium transition-colors',
                  active
                    ? 'text-[var(--color-brand-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                )}
                href={href}
                key={label}
              >
                <Icon className="size-[18px] shrink-0" />
                <span
                  className={cn(
                    'border-b-2 pb-0.5 transition-colors',
                    active ? 'border-[var(--color-brand-primary)]' : 'border-transparent',
                  )}
                >
                  {label}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <PlansAttentionBell />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
