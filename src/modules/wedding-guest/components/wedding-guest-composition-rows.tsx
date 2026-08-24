import {
  getCategoryColor,
  ShareBar,
} from '@/modules/wedding-guest/components/wedding-guest-stat-visuals';
import type { GuestAggregateStatistic } from '@/modules/wedding-guest/utils/wedding-guest-statistic';
import { cn } from '@/shared/utils/cn';

type CompositionRow = { attributeId: string } & GuestAggregateStatistic;

type WeddingGuestCompositionRowsProps = {
  rows: CompositionRow[];
  metric: 'guestCount' | 'moneyGiftTotal';
  getLabel: (attributeId: string) => string;
  onSelect?: (attributeId: string) => void;
};

export function WeddingGuestCompositionRows({
  rows,
  metric,
  getLabel,
  onSelect,
}: WeddingGuestCompositionRowsProps) {
  const totalBasis = rows.reduce((sum, row) => sum + row[metric], 0);

  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>;
  }

  return (
    <ul className="space-y-1">
      {rows.map((row, index) => {
        const color = getCategoryColor(index);
        const value = row[metric];
        const percent = totalBasis > 0 ? (value / totalBasis) * 100 : 0;
        const label = getLabel(row.attributeId);

        const content = (
          <>
            <span className="flex items-center gap-2 text-sm text-slate-700">
              <span
                className={cn('size-2.5 shrink-0 rounded-full', color.dot)}
              />
              {label}
            </span>
            <span className="flex items-center gap-3 text-right">
              <span className="hidden w-24 sm:block">
                <ShareBar className={color.bar} percent={percent} />
              </span>
              <span className="block w-10 shrink-0 text-sm font-semibold text-slate-950">
                {Math.round(percent)}%
              </span>
              <span className="block w-16 shrink-0 text-xs text-slate-500">
                {row.guestCount} khách
              </span>
            </span>
          </>
        );

        return (
          <li key={row.attributeId}>
            {onSelect ? (
              <button
                className="flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-slate-50"
                onClick={() => onSelect(row.attributeId)}
                type="button"
              >
                {content}
              </button>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5">
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
