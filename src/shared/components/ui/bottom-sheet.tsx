import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

type BottomSheetProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  open?: boolean;
  onClose?: () => void;
  children?: ReactNode;
};

export function BottomSheet({
  title,
  description,
  open,
  onClose,
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
        'flex max-h-[85vh] flex-col overflow-hidden rounded-t-[32px] border border-b-0 border-slate-200 bg-white p-5 shadow-[0_-16px_60px_rgba(15,23,42,0.08)]',
        className,
      )}
      {...props}
    >
      <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-200" />
      <div className="shrink-0">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {children ? <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">{children}</div> : null}
    </div>
  );

  if (open === undefined) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Đóng"
        className="absolute inset-0 bg-slate-950/40"
        onClick={onClose}
        type="button"
      />
      <div className="relative w-full md:max-w-md">{content}</div>
    </div>
  );
}
