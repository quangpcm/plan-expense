import { ChevronRight } from 'lucide-react';

import { milestoneStatusLabel } from '@/modules/milestone/utils/milestone-status';
import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import type { StatisticResult } from '@/modules/statistic/types/statistic';

type MilestoneBreakdownProps = {
  statistic: StatisticResult;
  onSelectMilestoneMember: (milestoneId: string, memberId: string) => void;
};

export function MilestoneBreakdown({ statistic, onSelectMilestoneMember }: MilestoneBreakdownProps) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-950">Theo mốc kế hoạch</h3>
      <div className="grid gap-3">
        {statistic.milestoneBreakdown.map((row) => (
          <div
            key={row.milestoneId}
            className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
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
            {row.memberBreakdown.length > 0 ? (
              <div className="grid gap-2 border-t border-slate-100 pt-3">
                {row.memberBreakdown.map((member) => (
                  <button
                    className="flex w-full items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-left text-sm transition hover:bg-slate-100"
                    key={member.memberId}
                    onClick={() => onSelectMilestoneMember(row.milestoneId, member.memberId)}
                    type="button"
                  >
                    <span className="text-slate-700">{member.nickname}</span>
                    <span className="flex items-center gap-1 text-slate-600">
                      {formatCurrency(member.totalAmount)}
                      <ChevronRight className="size-4 text-slate-400" />
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
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
