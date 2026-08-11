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
        'sticky top-0 z-10 -mx-4 flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-white/95 px-4 py-3 text-sm text-slate-500 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8',
        className,
      )}
      style={{ top: 'env(safe-area-inset-top)' }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={`${item.label}-${index}`} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link className="font-medium text-slate-500 transition hover:text-slate-900" href={item.href}>
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast ? 'font-semibold text-slate-900' : 'font-medium text-slate-500')}>
                {item.label}
              </span>
            )}
            {!isLast ? <ChevronRight className="size-4 text-slate-300" /> : null}
          </div>
        );
      })}
    </nav>
  );
}
