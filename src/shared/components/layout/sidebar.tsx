'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet } from 'lucide-react';

import { getAppNavigationItems } from '@/shared/components/layout/navigation-items';
import { cn } from '@/shared/utils/cn';

export function Sidebar() {
  const pathname = usePathname();
  const navigationItems = getAppNavigationItems(pathname);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[var(--color-border)] py-6 pr-6 lg:flex">
      <div className="flex items-center gap-2 px-2 pb-6">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
          <Wallet className="size-5" />
        </div>
        <span className="text-lg font-semibold text-[var(--color-foreground)]">Plan Expense</span>
      </div>

      <nav className="flex flex-col gap-1">
        {navigationItems.map(({ href, label, icon: Icon, active }) => (
          <Link
            className={cn(
              'flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium transition',
              active
                ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-foreground)]',
            )}
            href={href}
            key={label}
          >
            <Icon className="size-[18px] shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
