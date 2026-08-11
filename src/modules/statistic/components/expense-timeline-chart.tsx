import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import type { StatisticResult } from '@/modules/statistic/types/statistic';

type ExpenseTimelineChartProps = {
  statistic: StatisticResult;
};

export function ExpenseTimelineChart({ statistic }: ExpenseTimelineChartProps) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-950">Diễn biến chi tiêu</h3>
      <div className="grid gap-3">
        {statistic.expenseTimeline.map((row) => (
          <div
            key={row.date}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            <span className="font-medium text-slate-900">{row.date}</span>
            <span className="text-slate-600">{formatCurrency(row.totalAmount)}</span>
          </div>
        ))}
        {statistic.expenseTimeline.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Chưa có khoản chi nào để hiển thị theo thời gian.
          </div>
        ) : null}
      </div>
    </Card>
  );
}
