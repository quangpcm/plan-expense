import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

type ErrorStateProps = HTMLAttributes<HTMLDivElement> & {
  visual?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
};

/**
 * Communicates a recoverable or terminal UI-level failure. Shares EmptyState's visual recipe
 * (04.StructuralComponents.md §57 explicitly allows this) but stays a distinct component/export —
 * "empty" and "error" are different semantics even when they look alike. ErrorState does not
 * implement retry, parse backend errors, or log anything; the product layer supplies whatever
 * `action` fits the failure ("Thử lại", "Quay lại", "Yêu cầu quyền truy cập", ...) — no action is
 * hard-coded or assumed to be a retry (§58/§59).
 */
export function ErrorState({
  visual,
  title,
  description,
  action,
  secondaryAction,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center gap-3 px-4 py-10 text-center', className)}
      {...props}
    >
      {visual ? <div className="text-[var(--color-status-danger)]">{visual}</div> : null}
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
