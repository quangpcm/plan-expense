import { Card } from '@/shared/components/ui/card';
import { Metric } from '@/shared/components/ui/metric';
import { MetricGroup } from '@/shared/components/ui/metric-group';
import { formatCurrency } from '@/shared/utils/currency';
import type { StatisticResult } from '@/modules/statistic/types/statistic';

type StatisticOverviewProps = {
  statistic: StatisticResult;
};

export function StatisticOverview({ statistic }: StatisticOverviewProps) {
  return (
    <Card>
      <MetricGroup columns={4}>
        <Metric label="Tổng chi" size="sm" value={formatCurrency(statistic.overview.totalExpense)} />
        <Metric
          label="Tổng thu"
          size="sm"
          // Kept as the pre-existing literal `emerald-700` (not `tone="success"`, which resolves to
          // `--color-status-success` = emerald-600 — a different, non-exact shade) to preserve the
          // exact rendered color unchanged by this presentation migration.
          value={<span className="text-emerald-700">{formatCurrency(statistic.overview.totalIncome)}</span>}
        />
        <Metric label="Thành viên" size="sm" value={statistic.overview.memberCount} />
        <Metric label="Khoản chi" size="sm" value={statistic.overview.expenseCount} />
      </MetricGroup>
    </Card>
  );
}
