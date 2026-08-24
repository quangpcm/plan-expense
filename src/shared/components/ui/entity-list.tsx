import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

type EntityListProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  loading?: ReactNode;
  error?: ReactNode;
  empty?: ReactNode;
  divided?: boolean;
  density?: 'comfortable' | 'compact';
  children?: ReactNode;
};

const densityGapClassName = {
  comfortable: 'gap-4',
  compact: 'gap-2',
} as const;

/**
 * Generic collection shell: coordinates loading/error/empty/content presentation and row spacing.
 * EntityList does not fetch, sort, filter, paginate, or know entity semantics
 * (05.CorePatterns.md §12/§16). It does not decide which state is active — the product passes
 * `loading`/`error`/`empty` as truthy ReactNode only when that state applies (e.g.
 * `empty={plans.length === 0 ? <EmptyState .../> : undefined}`); EntityList just renders whichever
 * one is present, in priority order loading > error > empty > children. Children are not required
 * to be `DataRow` — any repeated content works (§14).
 */
export function EntityList({
  loading,
  error,
  empty,
  divided = false,
  density = 'comfortable',
  children,
  className,
  ...props
}: EntityListProps) {
  // Each state slot manages its own layout (Skeleton stack, ErrorState, EmptyState) — EntityList
  // renders it as-is rather than forcing it inside the row-list wrapper below, which only applies
  // to actual content.
  if (loading) {
    return <>{loading}</>;
  }

  if (error) {
    return <>{error}</>;
  }

  if (empty) {
    return <>{empty}</>;
  }

  return (
    <div
      className={cn('flex flex-col', densityGapClassName[density], divided ? 'divide-y divide-[var(--color-border-default)]' : '', className)}
      {...props}
    >
      {children}
    </div>
  );
}
