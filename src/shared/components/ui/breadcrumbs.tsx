import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { cn } from '@/shared/utils/cn';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'sticky top-0 z-10 -mx-4 flex flex-wrap items-center gap-2 border-b border-[var(--color-border-default)] bg-[color:color-mix(in_srgb,var(--color-surface-default)_95%,transparent)] px-4 py-3 text-sm text-[var(--color-text-secondary)] backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8',
        className,
      )}
      style={{ top: 'env(safe-area-inset-top)' }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link className="font-medium text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]" href={item.href}>
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast ? 'font-semibold text-[var(--color-text-primary)]' : 'font-medium text-[var(--color-text-secondary)]')}>
                {item.label}
              </span>
            )}
            {!isLast ? <ChevronRight className="size-4 text-[var(--color-text-muted)]" /> : null}
          </div>
        );
      })}
    </nav>
  );
}
