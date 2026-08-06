import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import type { StatisticResult } from '@/modules/statistic/types/statistic';

type StatisticOverviewProps = {
  statistic: StatisticResult;
};

export function StatisticOverview({ statistic }: StatisticOverviewProps) {
  return (
    <Card className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Tổng chi</p>
        <p className="mt-1 text-lg font-semibold text-slate-950">
          {formatCurrency(statistic.overview.totalExpense)}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Chi trung bình</p>
        <p className="mt-1 text-lg font-semibold text-slate-950">
          {formatCurrency(statistic.overview.averageExpense)}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Số thành viên</p>
        <p className="mt-1 text-lg font-semibold text-slate-950">{statistic.overview.memberCount}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Số khoản chi</p>
        <p className="mt-1 text-lg font-semibold text-slate-950">{statistic.overview.expenseCount}</p>
      </div>
      
    </Card>
  );
}
