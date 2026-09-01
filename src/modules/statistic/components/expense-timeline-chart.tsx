import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import type { StatisticResult } from '@/modules/statistic/types/statistic';

type ExpenseTimelineChartProps = {
  statistic: StatisticResult;
};

export function ExpenseTimelineChart({ statistic }: ExpenseTimelineChartProps) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Diễn biến chi tiêu</h3>
      <div className="grid gap-3">
        {statistic.expenseTimeline.map((row) => (
          <div
            key={row.date}
            className="flex items-center justify-between rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-default)] px-4 py-3 text-sm"
          >
            <span className="font-medium text-[var(--color-text-primary)]">{row.date}</span>
            <span className="text-[var(--color-text-secondary)]">{formatCurrency(row.totalAmount)}</span>
          </div>
        ))}
        {statistic.expenseTimeline.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
            Chưa có khoản chi nào để hiển thị theo thời gian.
          </div>
        ) : null}
      </div>
    </Card>
  );
}
