import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/utils/cn';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-2xl bg-[var(--color-surface-subtle)]', className)} {...props} />;
}
