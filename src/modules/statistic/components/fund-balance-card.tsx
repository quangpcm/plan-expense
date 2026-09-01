import { AlertTriangle } from 'lucide-react';

import { Card } from '@/shared/components/ui/card';
import { Metric } from '@/shared/components/ui/metric';
import { MetricGroup } from '@/shared/components/ui/metric-group';
import { formatCurrency } from '@/shared/utils/currency';
import type { StatisticResult } from '@/modules/statistic/types/statistic';

type FundBalanceCardProps = {
  statistic: StatisticResult;
};

export function FundBalanceCard({ statistic }: FundBalanceCardProps) {
  const { fund, invariant } = statistic;

  if (fund.totalIncome === 0) {
    return null;
  }

  return (
    <Card className="gap-3">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Quỹ chung</h3>
      <MetricGroup columns={3}>
        <Metric label="Quỹ chưa phân bổ" size="lg" value={formatCurrency(fund.unallocatedBalance)} />
        <Metric label="Đã phân bổ" size="sm" value={formatCurrency(fund.allocatedIncome)} />
        <Metric label="Tổng đã nạp quỹ" size="sm" value={formatCurrency(fund.totalIncome)} />
      </MetricGroup>
      {!invariant.valid ? (
        <div className="flex items-start gap-2 rounded-2xl border border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning)]/10 px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[color:var(--color-warning)]" />
          <span>
            Số liệu quỹ chung và cân đối thành viên đang lệch {formatCurrency(Math.abs(invariant.difference))}.
            Vui lòng kiểm tra lại dữ liệu giao dịch.
          </span>
        </div>
      ) : null}
    </Card>
  );
}
