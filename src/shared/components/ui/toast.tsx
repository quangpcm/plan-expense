import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/utils/cn';

const toastVariants = {
  info: 'bg-[var(--color-status-info)] text-white',
  success: 'bg-[var(--color-success)] text-white',
  danger: 'bg-[var(--color-danger)] text-white',
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
