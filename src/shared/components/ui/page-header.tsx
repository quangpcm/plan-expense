import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

type PageHeaderProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  title: ReactNode;
  description?: ReactNode;
  metadata?: ReactNode;
  actions?: ReactNode;
};

/**
 * Page-level identity/action shell: title, optional description/metadata, optional actions.
 * PageHeader does not know who may act, what an action does, or any Plan/domain semantics
 * (05.CorePatterns.md §43/§47/§48/§49) — the product resolves permission/copy/behavior before
 * passing `actions`. This is a generic shell, not the rich product-specific Plan/Wedding header —
 * those remain their own components and may compose PageHeader internally (§44/§89).
 */
export function PageHeader({ title, description, metadata, actions, className, ...props }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4', className)} {...props}>
      <div className="min-w-0 space-y-1">
        <h1 className="text-page-title text-[var(--color-text-primary)]">{title}</h1>
        {description ? <p className="text-body text-[var(--color-text-secondary)]">{description}</p> : null}
        {metadata ? <div className="text-metadata text-[var(--color-text-muted)]">{metadata}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}
