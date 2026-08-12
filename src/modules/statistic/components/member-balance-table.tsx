import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import type { StatisticResult } from '@/modules/statistic/types/statistic';

type MemberBalanceTableProps = {
  statistic: StatisticResult;
};

export function MemberBalanceTable({ statistic }: MemberBalanceTableProps) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-950">Cân đối theo thành viên</h3>
      <div className="grid gap-3">
        {statistic.memberBalances.map((row) => (
          <div
            key={row.memberId}
            className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm sm:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr]"
          >
            <div className="font-semibold text-slate-900">{row.nickname}</div>
            <div className="text-slate-600">Đã trả: {formatCurrency(row.paid)}</div>
            <div className="text-slate-600">Phải chịu: {formatCurrency(row.owed)}</div>
            <div className="text-emerald-700">Đã nạp quỹ: {formatCurrency(row.totalIncome)}</div>
            <div className="text-slate-600">
              Đối soát: {formatCurrency(row.settlementPaid - row.settlementReceived)}
            </div>
            <div
              className={
                row.adjustedBalance >= 0 ? 'font-medium text-emerald-700' : 'font-medium text-rose-700'
              }
            >
              {row.adjustedBalance >= 0
                ? `Sẽ nhận: ${formatCurrency(row.adjustedBalance)}`
                : `Cần trả: ${formatCurrency(Math.abs(row.adjustedBalance))}`}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
