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
      className={cn('flex flex-wrap items-center gap-2 text-sm text-slate-500', className)}
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
