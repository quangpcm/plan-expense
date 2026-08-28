import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

type DialogProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  children?: ReactNode;
};

/**
 * @deprecated Design System V2: use `ResponsiveModal` instead, which provides this same surface
 * plus portal rendering, backdrop, focus lifecycle and a responsive mobile presentation. Existing
 * consumers continue to work — do not add new usage. Remove only once all consumers have migrated
 * (see docs/design-sys-v2/implement-specs/reports/03.OverlayArchitecture.Report.md).
 */
export function Dialog({ title, description, children, className, ...props }: DialogProps) {
  return (
    <div
      className={cn(
        'rounded-[28px] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 text-[var(--color-text-primary)] shadow-[var(--shadow-overlay)]',
        className,
      )}
      {...props}
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
        {description ? <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p> : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
