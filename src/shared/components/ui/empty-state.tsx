import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  visual?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
};

/**
 * Communicates absence of content. EmptyState does not decide why data is empty, which entity to
 * create, or whether the user has permission — the product layer supplies (or omits) `action`
 * accordingly (04.StructuralComponents.md §51-55). No permission prop exists on this component by
 * design: passing role/permission data here so it can decide would put authorization logic in a
 * generic presentation component.
 */
export function EmptyState({
  visual,
  title,
  description,
  action,
  secondaryAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center gap-3 px-4 py-10 text-center', className)}
      {...props}
    >
      {visual ? <div className="text-[var(--color-text-muted)]">{visual}</div> : null}
      <div className="space-y-1">
        <p className="text-component-title text-[var(--color-text-primary)]">{title}</p>
        {description ? (
          <p className="text-body text-[var(--color-text-secondary)]">{description}</p>
        ) : null}
      </div>
      {action || secondaryAction ? (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
