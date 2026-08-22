import { Card } from '@/shared/components/ui/card';
import { cn } from '@/shared/utils/cn';
import { formatCurrency } from '@/shared/utils/currency';
import type { StatisticResult } from '@/modules/statistic/types/statistic';

type FinanceSummaryHeroProps = {
  statistic: StatisticResult;
};

export function FinanceSummaryHero({ statistic }: FinanceSummaryHeroProps) {
  const { overview } = statistic;
  const hasPending = overview.pendingSettlementAmount > 0;

  return (
    <Card className="gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Tổng chi</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">
            {formatCurrency(overview.totalExpense)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Đã đối soát</p>
          <p className="mt-1 text-2xl font-semibold text-[color:var(--color-success)]">
            {formatCurrency(overview.settledAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Còn đối soát</p>
          <p
            className={cn(
              'mt-1 text-2xl font-semibold',
              hasPending ? 'text-[color:var(--color-warning)]' : 'text-slate-950',
            )}
          >
            {formatCurrency(overview.pendingSettlementAmount)}
          </p>
        </div>
      </div>
      <p className="text-sm text-slate-500">
        {overview.expenseCount} khoản chi · {overview.memberCount} thành viên
        {overview.totalIncome > 0 ? ` · Tổng thu ${formatCurrency(overview.totalIncome)}` : ''}
      </p>
    </Card>
  );
}
