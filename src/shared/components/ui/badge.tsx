import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/utils/cn';

const badgeVariants = {
  neutral: 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]',
  info: 'bg-[var(--color-info-soft)] text-[var(--color-info)]',
  success: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning-soft)] text-[color:var(--color-warning)]',
  danger: 'bg-[var(--color-danger-soft)] text-[color:var(--color-danger)]',
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
