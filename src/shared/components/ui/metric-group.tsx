import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/utils/cn';

// Responsive column counts only — no domain knowledge, no metric-count inference. Consumer picks
// the columns value; MetricGroup never derives layout from what's inside it
// (04.StructuralComponents.md §36/§37/§38 — this is the hard guardrail wave, kept intentionally
// tiny: layout only, composition-based, no config object).
const columnsClassName = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
} as const;

const densityGapClassName = {
  comfortable: 'gap-6',
  default: 'gap-4',
  compact: 'gap-3',
} as const;

type MetricGroupProps = HTMLAttributes<HTMLDivElement> & {
  columns?: keyof typeof columnsClassName;
  density?: keyof typeof densityGapClassName;
};

/**
 * Arranges Metric children in a responsive grid. Layout only — columns, gap, density. Does not
 * calculate, aggregate, or know what a Metric represents (04.StructuralComponents.md §35-39).
 * Compose it with <Metric> children; do not pass a data/config array.
 */
export function MetricGroup({ columns = 3, density = 'default', className, ...props }: MetricGroupProps) {
  return (
    <div
      className={cn('grid', columnsClassName[columns], densityGapClassName[density], className)}
      {...props}
    />
  );
}
