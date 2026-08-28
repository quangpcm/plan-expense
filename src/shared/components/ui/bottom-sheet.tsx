import type { HTMLAttributes, ReactNode } from 'react';
import { X } from 'lucide-react';

import { cn } from '@/shared/utils/cn';

type BottomSheetProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  open?: boolean;
  onClose?: () => void;
  showCloseButton?: boolean;
  children?: ReactNode;
};

/**
 * @deprecated Design System V2: use `ResponsiveModal` instead, which provides this same mobile
 * sheet presentation plus portal rendering, focus lifecycle and Escape handling (this component
 * has neither). Existing consumers continue to work — do not add new usage. Remove only once all
 * consumers have migrated (see
 * docs/design-sys-v2/implement-specs/reports/03.OverlayArchitecture.Report.md).
 */
export function BottomSheet({
  title,
  description,
  open,
  onClose,
  showCloseButton = false,
  children,
  className,
  ...props
}: BottomSheetProps) {
  if (open === false) {
    return null;
  }

  const content = (
    <div
      className={cn(
        'relative flex max-h-[85vh] flex-col overflow-hidden rounded-t-[32px] border border-b-0 border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 text-[var(--color-text-primary)] shadow-[var(--shadow-overlay)]',
        className,
      )}
      {...props}
    >
      {showCloseButton && onClose ? (
        <button
          aria-label="Đóng"
          className="absolute right-4 top-4 rounded-full p-1.5 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-secondary)]"
          onClick={onClose}
          type="button"
        >
          <X className="size-5" />
        </button>
      ) : null}
      <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-[var(--color-border-default)]" />
      <div className="shrink-0">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p> : null}
      </div>
      {children ? <div className="mt-4 min-h-0 overflow-y-auto overscroll-contain pr-1">{children}</div> : null}
    </div>
  );

  if (open === undefined) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Đóng"
        className="absolute inset-0 bg-[var(--color-overlay-backdrop)]"
        onClick={onClose}
        type="button"
      />
      <div className="relative w-full md:max-w-md">{content}</div>
    </div>
  );
}
