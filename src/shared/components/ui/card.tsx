import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/utils/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white/90 p-5 shadow-[0_16px_60px_rgba(15,23,42,0.06)]',
        className,
      )}
      {...props}
    />
  );
}

