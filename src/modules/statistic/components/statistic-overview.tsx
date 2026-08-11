import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import type { StatisticResult } from '@/modules/statistic/types/statistic';

type StatisticOverviewProps = {
  statistic: StatisticResult;
};

export function StatisticOverview({ statistic }: StatisticOverviewProps) {
  const activeMilestoneCount = statistic.milestoneBreakdown.filter((milestone) => milestone.totalAmount > 0).length;

  return (
    <Card className="grid grid-cols-2 gap-4 xl:grid-cols-5">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Tổng chi</p>
        <p className="mt-1 text-lg font-semibold text-slate-950">
          {formatCurrency(statistic.overview.totalExpense)}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Tổng thu</p>
        <p className="mt-1 text-lg font-semibold text-emerald-700">
          {formatCurrency(statistic.overview.totalIncome)}
        </p>
      </div>
      {/* <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Chi trung bình</p>
        <p className="mt-1 text-lg font-semibold text-slate-950">
          {formatCurrency(statistic.overview.averageExpense)}
        </p>
      </div> */}
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Thành viên</p>
        <p className="mt-1 text-lg font-semibold text-slate-950">{statistic.overview.memberCount}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Khoản chi</p>
        <p className="mt-1 text-lg font-semibold text-slate-950">{statistic.overview.expenseCount}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Mốc phát sinh chi</p>
        <p className="mt-1 text-lg font-semibold text-slate-950">{activeMilestoneCount}</p>
      </div>
    </Card>
  );
}
