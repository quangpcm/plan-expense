import { Card } from '@/shared/components/ui/card';
import { Metric } from '@/shared/components/ui/metric';
import { MetricGroup } from '@/shared/components/ui/metric-group';
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
      <MetricGroup columns={3}>
        <Metric label="Tổng chi" size="lg" value={formatCurrency(overview.totalExpense)} />
        <Metric label="Đã đối soát" size="lg" tone="success" value={formatCurrency(overview.settledAmount)} />
        <Metric
          label="Còn đối soát"
          size="lg"
          tone={hasPending ? 'warning' : 'default'}
          value={formatCurrency(overview.pendingSettlementAmount)}
        />
      </MetricGroup>
      <p className="text-sm text-[var(--color-text-muted)]">
        {overview.expenseCount} khoản chi · {overview.memberCount} thành viên
        {overview.totalIncome > 0 ? ` · Tổng thu ${formatCurrency(overview.totalIncome)}` : ''}
      </p>
    </Card>
  );
}
