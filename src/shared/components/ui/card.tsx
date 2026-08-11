import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/utils/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[0_18px_54px_rgba(23,32,51,0.06)]',
        className,
      )}
      {...props}
    />
  );
}
