'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { getAppNavigationItems } from '@/shared/components/layout/navigation-items';
import { cn } from '@/shared/utils/cn';

// Mobile-only global destination switcher (Hôm nay / Kế hoạch). Desktop keeps the existing
// AppHeader top nav — this does not replace it, it fills the gap on viewports where that nav is
// hidden (`hidden md:flex` in AppHeader). Reuses the same navigation-items source so active-route
// logic and icon identity stay in sync with the desktop nav.
export function AppBottomNav() {
  const pathname = usePathname();
  const navigationItems = getAppNavigationItems(pathname);

  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-[var(--z-index-sticky)] border-t border-[var(--color-border-subtle)] bg-[color-mix(in_srgb,var(--color-surface-default)_96%,transparent)] backdrop-blur md:hidden"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex w-full max-w-[1500px] items-stretch justify-around px-2 pt-1.5">
        {navigationItems.map(({ href, label, icon: Icon, active }) => (
          <Link
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors',
              active
                ? 'text-[var(--color-brand-primary)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}
            href={href}
            key={label}
          >
            <Icon className="size-5 shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
