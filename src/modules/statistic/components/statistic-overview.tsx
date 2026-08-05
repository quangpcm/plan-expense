import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import type { StatisticResult } from '@/modules/statistic/types/statistic';

type StatisticOverviewProps = {
  statistic: StatisticResult;
};

export function StatisticOverview({ statistic }: StatisticOverviewProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="gap-2">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Tổng chi</p>
        <p className="text-2xl font-semibold text-slate-950">
          {formatCurrency(statistic.overview.totalExpense)}
        </p>
      </Card>
      <Card className="gap-2">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Số thành viên</p>
        <p className="text-2xl font-semibold text-slate-950">{statistic.overview.memberCount}</p>
      </Card>
      <Card className="gap-2">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Số khoản chi</p>
        <p className="text-2xl font-semibold text-slate-950">{statistic.overview.expenseCount}</p>
      </Card>
      <Card className="gap-2">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Chi trung bình</p>
        <p className="text-2xl font-semibold text-slate-950">
          {formatCurrency(statistic.overview.averageExpense)}
        </p>
      </Card>
    </div>
  );
}
