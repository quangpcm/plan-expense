import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/utils/cn';

const toastVariants = {
  info: 'bg-[var(--color-status-info)] text-[var(--color-text-inverse)]',
  success: 'bg-[var(--color-status-success)] text-[var(--color-text-inverse)]',
  danger: 'bg-[var(--color-status-danger)] text-[var(--color-text-inverse)]',
} as const;

type ToastProps = HTMLAttributes<HTMLDivElement> & {
  variant?: keyof typeof toastVariants;
};

export function Toast({ className, variant = 'info', ...props }: ToastProps) {
  return (
    <div
      className={cn(
        'inline-flex min-h-12 items-center rounded-2xl px-4 py-3 text-sm shadow-lg',
        toastVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
