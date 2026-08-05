import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import type { StatisticResult } from '@/modules/statistic/types/statistic';

type MemberBalanceTableProps = {
  statistic: StatisticResult;
};

export function MemberBalanceTable({ statistic }: MemberBalanceTableProps) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-950">Member balance</h3>
      <div className="grid gap-3">
        {statistic.memberBalances.map((row) => (
          <div
            key={row.memberId}
            className="grid gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm sm:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]"
          >
            <div className="font-semibold text-slate-900">{row.nickname}</div>
            <div className="text-slate-600">Paid: {formatCurrency(row.paid)}</div>
            <div className="text-slate-600">Owed: {formatCurrency(row.owed)}</div>
            <div className="text-slate-600">
              Settlement: {formatCurrency(row.settlementPaid - row.settlementReceived)}
            </div>
            <div
              className={
                row.adjustedBalance >= 0 ? 'font-medium text-emerald-700' : 'font-medium text-rose-700'
              }
            >
              Adjusted: {formatCurrency(row.adjustedBalance)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
