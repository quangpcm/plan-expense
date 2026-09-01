import { cn } from '@/shared/utils/cn';

// Each row's dot/bar shares one categorical hue, assigned in fixed order — but
// the name/label is always rendered alongside it, so color never carries
// identity on its own. Categories beyond the fixed set fall back to neutral
// gray instead of wrapping back to an earlier hue.
const CATEGORY_COLORS = [
  { dot: 'bg-amber-500', bar: 'bg-amber-500' },
  { dot: 'bg-indigo-500', bar: 'bg-indigo-500' },
  { dot: 'bg-[var(--color-surface-overlay)]', bar: 'bg-[var(--color-surface-overlay)]' },
  { dot: 'bg-emerald-600', bar: 'bg-emerald-600' },
  { dot: 'bg-rose-500', bar: 'bg-rose-500' },
  { dot: 'bg-sky-600', bar: 'bg-sky-600' },
];
const FALLBACK_COLOR = { dot: 'bg-[var(--color-surface-overlay)]', bar: 'bg-[var(--color-surface-overlay)]' };

export function getCategoryColor(index: number) {
  return CATEGORY_COLORS[index] ?? FALLBACK_COLOR;
}

export function ShareBar({
  percent,
  className,
}: {
  percent: number;
  className: string;
}) {
  const safePercent = Number.isFinite(percent)
    ? Math.min(100, Math.max(0, percent))
    : 0;

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
      <div
        className={cn('h-full rounded-full', className)}
        style={{ width: `${safePercent}%` }}
      />
    </div>
  );
}

export function TopBadge() {
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
      Top
    </span>
  );
}
