import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import type { StatisticResult } from '@/modules/statistic/types/statistic';

type MilestoneBreakdownProps = {
  statistic: StatisticResult;
};

const milestoneStatusLabel = {
  upcoming: 'Sắp tới',
  in_progress: 'Đang diễn ra',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
} as const;

export function MilestoneBreakdown({ statistic }: MilestoneBreakdownProps) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-950">Theo mốc kế hoạch</h3>
      <div className="grid gap-3">
        {statistic.milestoneBreakdown.map((row) => (
          <div
            key={row.milestoneId}
            className="grid gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm sm:grid-cols-[1.4fr_1fr_1fr]"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-900">{row.milestoneTitle}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                  {milestoneStatusLabel[row.status]}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {row.completedTodoCount}/{row.todoCount} công việc hoàn thành · {row.expenseCount} khoản chi
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Đã chi</p>
              <p className="mt-1 font-semibold text-slate-950">{formatCurrency(row.totalAmount)}</p>
              <p className="mt-1 text-xs text-slate-500">
                {row.budgetAmount != null ? `Ngân sách ${formatCurrency(row.budgetAmount)}` : 'Chưa đặt ngân sách'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Tiến độ</p>
              <p className="mt-1 font-semibold text-slate-950">{row.progress}%</p>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-sky-500 transition-[width]"
                  style={{ width: `${Math.min(row.progress, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
        {statistic.milestoneBreakdown.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Chưa có mốc kế hoạch nào.
          </div>
        ) : null}
      </div>
    </Card>
  );
}
