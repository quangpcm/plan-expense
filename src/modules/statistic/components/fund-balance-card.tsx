import { AlertTriangle } from 'lucide-react';

import { Card } from '@/shared/components/ui/card';
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
      <h3 className="text-lg font-semibold text-slate-950">Quỹ chung</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Quỹ chưa phân bổ</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{formatCurrency(fund.unallocatedBalance)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Đã phân bổ</p>
          <p className="mt-1 text-lg font-medium text-slate-700">{formatCurrency(fund.allocatedIncome)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Tổng đã nạp quỹ</p>
          <p className="mt-1 text-lg font-medium text-slate-700">{formatCurrency(fund.totalIncome)}</p>
        </div>
      </div>
      {!invariant.valid ? (
        <div className="flex items-start gap-2 rounded-2xl border border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning)]/10 px-4 py-3 text-sm text-slate-700">
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
