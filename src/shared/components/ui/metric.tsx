import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

const metricToneClassName = {
  // Finance neutral-by-default invariant (04.StructuralComponents.md §31): `default` is the
  // ordinary tone for any amount/count. Semantic tones are opt-in, resolved by the consumer, not
  // inferred from the value itself.
  default: 'text-[var(--color-text-primary)]',
  success: 'text-[var(--color-status-success)]',
  warning: 'text-[var(--color-status-warning)]',
  danger: 'text-[var(--color-status-danger)]',
  brand: 'text-[var(--color-brand-primary)]',
} as const;

const metricSizeClassName = {
  sm: 'text-metric-sm',
  md: 'text-metric-md',
  lg: 'text-metric-lg',
} as const;

type MetricProps = HTMLAttributes<HTMLDivElement> & {
  label: ReactNode;
  value: ReactNode;
  supporting?: ReactNode;
  leading?: ReactNode;
  tone?: keyof typeof metricToneClassName;
  size?: keyof typeof metricSizeClassName;
};

/**
 * Presents one label + one already-resolved value. Metric does not calculate, format currency, or
 * know what the number means — the consumer resolves and formats the value before it ever reaches
 * this component (04.StructuralComponents.md §27/§28/§29/§30).
 */
export function Metric({
  label,
  value,
  supporting,
  leading,
  tone = 'default',
  size = 'md',
  className,
  ...props
}: MetricProps) {
  return (
    <div className={cn('flex items-start gap-3', className)} {...props}>
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0">
        <p className="text-metadata text-[var(--color-text-secondary)]">{label}</p>
        <p className={cn('truncate font-bold', metricSizeClassName[size], metricToneClassName[tone])}>{value}</p>
        {supporting ? <p className="text-metadata text-[var(--color-text-muted)]">{supporting}</p> : null}
      </div>
    </div>
  );
}
