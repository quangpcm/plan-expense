import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

type BottomSheetProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  children?: ReactNode;
};

export function BottomSheet({ title, children, className, ...props }: BottomSheetProps) {
  return (
    <div
      className={cn(
        'rounded-t-[32px] border border-b-0 border-slate-200 bg-white p-5 shadow-[0_-16px_60px_rgba(15,23,42,0.08)]',
        className,
      )}
      {...props}
    >
      <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-200" />
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

