import { Avatar } from '@/shared/components/ui/avatar';
import { Card } from '@/shared/components/ui/card';
import { cn } from '@/shared/utils/cn';
import { formatCurrency } from '@/shared/utils/currency';
import type { StatisticResult } from '@/modules/statistic/types/statistic';

type MemberBalanceTableProps = {
  statistic: StatisticResult;
};

export function MemberBalanceTable({ statistic }: MemberBalanceTableProps) {
  const rows = statistic.memberBalances;
  const maxValue = Math.max(
    1,
    ...rows.map((row) => Math.max(row.paid + row.totalIncome, row.owed)),
  );

  return (
    <Card className="gap-4">
      <h3 className="text-lg font-semibold text-slate-950">Cân đối thành viên</h3>
      <div className="grid gap-3 xl:grid-cols-2">
        {rows.map((row) => {
          const totalContribution = row.paid + row.totalIncome;
          const willReceive = row.adjustedBalance >= 0;

          return (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3" key={row.memberId}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar
                    className="size-8 text-xs"
                    initials={row.nickname.slice(0, 2).toUpperCase()}
                    src={row.avatarUrl ?? null}
                  />
                  <span className="truncate font-semibold text-slate-900">{row.nickname}</span>
                </div>
                <span
                  className={cn(
                    'shrink-0 text-sm font-semibold',
                    willReceive ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]',
                  )}
                >
                  {willReceive ? '+' : '−'}
                  {formatCurrency(Math.abs(row.adjustedBalance))} {willReceive ? 'Sẽ nhận' : 'Cần trả'}
                </span>
              </div>

              <div className="mt-2.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[var(--color-primary)]"
                      style={{ width: `${(totalContribution / maxValue) * 100}%` }}
                    />
                  </div>
                  <p className="shrink-0 text-xs text-slate-500">
                    Đã góp: <span className="font-medium text-slate-700">{formatCurrency(totalContribution)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-400"
                      style={{ width: `${(row.owed / maxValue) * 100}%` }}
                    />
                  </div>
                  <p className="shrink-0 text-xs text-slate-500">
                    Phải chịu: <span className="font-medium text-slate-700">{formatCurrency(row.owed)}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Chưa có dữ liệu để cân đối giữa các thành viên.
          </div>
        ) : null}
      </div>
    </Card>
  );
}
