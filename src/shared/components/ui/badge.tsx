import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/utils/cn';

const badgeVariants = {
  // No exact Foundation semantic equivalent for this neutral secondary pairing yet (Wave 1 didn't
  // alias --color-secondary/-foreground to anything) — left as the raw legacy tokens rather than
  // forcing an inexact mapping.
  neutral: 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]',
  info: 'bg-[var(--color-status-info-surface)] text-[var(--color-status-info)]',
  success: 'bg-[var(--color-status-success-surface)] text-[var(--color-status-success)]',
  warning: 'bg-[var(--color-status-warning-surface)] text-[color:var(--color-status-warning)]',
  danger: 'bg-[var(--color-status-danger-surface)] text-[color:var(--color-status-danger)]',
} as const;

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof badgeVariants;
};

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  );
}
