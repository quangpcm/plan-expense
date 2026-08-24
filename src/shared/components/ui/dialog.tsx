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
        'rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_60px_rgba(15,23,42,0.1)]',
        className,
      )}
      {...props}
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        {description ? <p className="text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

