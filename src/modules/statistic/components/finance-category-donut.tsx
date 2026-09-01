import { getCategoryIcon } from '@/modules/category/utils/category-icon';
import { Card } from '@/shared/components/ui/card';
import { formatCompactCurrency, formatCurrency } from '@/shared/utils/currency';
import type { StatisticResult } from '@/modules/statistic/types/statistic';

type FinanceCategoryDonutProps = {
  statistic: StatisticResult;
};

// iconColor của category là Tailwind class dạng `text-{name}-600` (xem
// category-icon.ts) — SVG stroke cần hex thật, nên map sang đúng màu hệ Tailwind
// mặc định ở shade 600 để donut phản ánh đúng màu icon của từng category.
const TAILWIND_600_HEX: Record<string, string> = {
  slate: '#475569',
  gray: '#4b5563',
  zinc: '#52525b',
  neutral: '#525252',
  stone: '#57534e',
  red: '#dc2626',
  orange: '#ea580c',
  amber: '#d97706',
  yellow: '#ca8a04',
  lime: '#65a30d',
  green: '#16a34a',
  emerald: '#059669',
  teal: '#0d9488',
  cyan: '#0891b2',
  sky: '#0284c7',
  blue: '#2563eb',
  indigo: '#4f46e5',
  violet: '#7c3aed',
  purple: '#9333ea',
  fuchsia: '#c026d3',
  pink: '#db2777',
  rose: '#e11d48',
};

export function resolveCategoryColor(iconColorClass: string) {
  const colorName = iconColorClass.match(/^text-([a-z]+)-\d+$/)?.[1];
  return (colorName && TAILWIND_600_HEX[colorName]) || '#64748b';
}

const MAX_SEGMENTS = 5;

const RADIUS = 50;
const STROKE_WIDTH = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SEGMENT_GAP = 4;

export function FinanceCategoryDonut({ statistic }: FinanceCategoryDonutProps) {
  const rows = statistic.categoryBreakdown.filter((row) => row.totalAmount > 0);
  const total = rows.reduce((sum, row) => sum + row.totalAmount, 0);

  const visibleRows = rows.slice(0, MAX_SEGMENTS);
  const restAmount = rows.slice(MAX_SEGMENTS).reduce((sum, row) => sum + row.totalAmount, 0);
  const segments = [
    ...visibleRows.map((row) => ({
      key: row.categoryId ?? 'none',
      label: row.categoryName,
      icon: row.icon,
      iconColor: row.iconColor,
      iconBgColor: row.iconBgColor,
      amount: row.totalAmount,
      color: resolveCategoryColor(row.iconColor),
    })),
    ...(restAmount > 0
      ? [
          {
            key: 'rest',
            label: 'Khác',
            icon: null,
            iconColor: 'text-[var(--color-text-secondary)]',
            iconBgColor: 'bg-[var(--color-surface-subtle)]',
            amount: restAmount,
            color: '#94a3b8',
          },
        ]
      : []),
  ];

  let offset = 0;
  const arcs = segments.map((segment) => {
    const share = total > 0 ? segment.amount / total : 0;
    const rawLength = share * CIRCUMFERENCE;
    const arcLength = segment.amount > 0 ? Math.max(rawLength - SEGMENT_GAP, 1) : 0;
    const dashOffset = -offset;
    offset += rawLength;

    return { ...segment, share, arcLength, dashOffset };
  });

  return (
    <Card className="gap-4">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Chi tiêu theo danh mục</h3>
      {segments.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          Chưa có dữ liệu danh mục để phân tích.
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5">
          <div className="relative size-40 shrink-0">
            <svg className="size-40 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" fill="none" r={RADIUS} stroke="var(--color-border-default)" strokeWidth={STROKE_WIDTH} />
              {arcs.map((arc) =>
                arc.amount > 0 ? (
                  <circle
                    cx="60"
                    cy="60"
                    fill="none"
                    key={arc.key}
                    r={RADIUS}
                    stroke={arc.color}
                    strokeDasharray={`${arc.arcLength} ${CIRCUMFERENCE - arc.arcLength}`}
                    strokeDashoffset={arc.dashOffset}
                    strokeLinecap="butt"
                    strokeWidth={STROKE_WIDTH}
                  >
                    <title>
                      {arc.label}: {formatCurrency(arc.amount)}
                    </title>
                  </circle>
                ) : null,
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
              <p className="text-xl font-semibold text-[var(--color-text-primary)]">{formatCompactCurrency(total)}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Tổng chi</p>
            </div>
          </div>

          <ul className="w-full space-y-2">
            {arcs.map((arc) => {
              const Icon = arc.icon ? getCategoryIcon(arc.icon) : null;

              return (
                <li className="flex items-center justify-between gap-2 text-sm" key={arc.key}>
                  <span className="flex min-w-0 items-center gap-2 text-[var(--color-text-secondary)]">
                    {Icon ? (
                      <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${arc.iconBgColor}`}>
                        <Icon className={`size-3.5 ${arc.iconColor}`} />
                      </span>
                    ) : (
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: arc.color }}
                      />
                    )}
                    <span className="truncate">{arc.label}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-[var(--color-text-muted)]">{Math.round(arc.share * 100)}%</span>
                    <span className="font-medium text-[var(--color-text-primary)]">{formatCurrency(arc.amount)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
