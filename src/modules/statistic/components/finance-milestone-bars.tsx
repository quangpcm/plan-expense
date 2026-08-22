import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import type { StatisticResult } from '@/modules/statistic/types/statistic';

type FinanceMilestoneBarsProps = {
  statistic: StatisticResult;
};

export function FinanceMilestoneBars({ statistic }: FinanceMilestoneBarsProps) {
  const rows = statistic.milestoneBreakdown;
  const maxAmount = Math.max(1, ...rows.map((row) => row.totalAmount));

  return (
    <Card className="gap-4">
      <h3 className="text-lg font-semibold text-slate-950">Theo mốc kế hoạch</h3>
      <div className="grid gap-4">
        {rows.map((row) => (
          <div className="space-y-1.5" key={row.milestoneId}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-slate-900">{row.milestoneTitle}</span>
              <span className="shrink-0 font-semibold text-slate-950">{formatCurrency(row.totalAmount)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[var(--color-primary)]"
                style={{ width: `${(row.totalAmount / maxAmount) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              {row.expenseCount} khoản chi
              {row.budgetAmount != null ? ` · Ngân sách ${formatCurrency(row.budgetAmount)}` : ''}
            </p>
          </div>
        ))}
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Chưa có mốc kế hoạch nào.
          </div>
        ) : null}
      </div>
    </Card>
  );
}
