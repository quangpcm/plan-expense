import { Avatar } from '@/shared/components/ui/avatar';
import { Card } from '@/shared/components/ui/card';
import { cn } from '@/shared/utils/cn';
import { formatCurrency } from '@/shared/utils/currency';
import type { StatisticResult } from '@/modules/statistic/types/statistic';

type MemberBalanceTableProps = {
  statistic: StatisticResult;
};

function ComparisonBar({
  label,
  amount,
  maxValue,
  tone,
}: {
  label: string;
  amount: number;
  maxValue: number;
  tone: 'primary' | 'neutral';
}) {
  const widthPercent = Math.min(100, Math.max(0, (amount / maxValue) * 100));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-[var(--color-text-muted)]">{label}</span>
        <span className="font-medium text-[var(--color-text-secondary)]">{formatCurrency(amount)}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
        <div
          className={cn(
            'h-full rounded-full',
            tone === 'primary' ? 'bg-[var(--color-brand-primary)]' : 'bg-[var(--color-text-muted)]',
          )}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
    </div>
  );
}

export function MemberBalanceTable({ statistic }: MemberBalanceTableProps) {
  const rows = statistic.memberBalances;
  // Đóng góp ròng = Tự thanh toán + Nạp quỹ - Đã được hoàn từ quỹ. Dùng con
  // số này (thay vì gross contribution) để so sánh trực tiếp với "Phải chịu"
  // — QP tự chi 16,4tr nhưng đã được hoàn 7,4tr từ quỹ nên phần ròng chỉ còn
  // 8,97tr, khớp với balance cuối cùng thay vì trông như vẫn dư nhiều.
  const netContributions = new Map(
    rows.map((row) => [row.memberId, row.paid + row.totalIncome - row.incomeAllocatedToMember]),
  );
  const maxValue = Math.max(
    1,
    ...rows.map((row) => Math.max(netContributions.get(row.memberId) ?? 0, row.owed)),
  );

  return (
    <Card className="gap-4">
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Cân đối thành viên</h3>
      <div className="grid gap-3 xl:grid-cols-2">
        {rows.map((row) => {
          const netContribution = netContributions.get(row.memberId) ?? 0;
          const willReceive = row.adjustedBalance >= 0;
          const breakdownEntries = [
            row.paid > 0 ? { label: 'Tự thanh toán', amount: row.paid } : null,
            row.totalIncome > 0 ? { label: 'Nạp quỹ', amount: row.totalIncome } : null,
            row.incomeAllocatedToMember > 0 ? { label: 'Bù từ quỹ', amount: row.incomeAllocatedToMember } : null,
          ].filter((entry): entry is { label: string; amount: number } => entry !== null);

          return (
            <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-default)] px-4 py-3.5" key={row.memberId}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar
                    className="size-8 text-xs"
                    initials={row.nickname.slice(0, 2).toUpperCase()}
                    src={row.avatarUrl ?? null}
                  />
                  <span className="truncate font-semibold text-[var(--color-text-primary)]">{row.nickname}</span>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      willReceive ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]',
                    )}
                  >
                    {willReceive ? '+' : '−'}
                    {formatCurrency(Math.abs(row.adjustedBalance))}
                  </span>
                  <span
                    className={cn(
                      'text-[11px]',
                      willReceive ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]',
                    )}
                  >
                    {willReceive ? 'Còn được nhận' : 'Cần trả'}
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-2.5">
                <ComparisonBar amount={netContribution} label="Đóng góp ròng" maxValue={maxValue} tone="primary" />
                <ComparisonBar amount={row.owed} label="Phải chịu" maxValue={maxValue} tone="neutral" />
              </div>

              {breakdownEntries.length > 0 ? (
                <div className="mt-2.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-[11px]">
                  {breakdownEntries.map((entry, index) => (
                    <span className="flex items-baseline gap-1" key={entry.label}>
                      {index > 0 ? <span className="text-[var(--color-text-muted)]">·</span> : null}
                      <span className="text-[var(--color-text-muted)]">{entry.label}</span>
                      <span className="font-medium text-[var(--color-text-secondary)]">{formatCurrency(entry.amount)}</span>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
            Chưa có dữ liệu để cân đối giữa các thành viên.
          </div>
        ) : null}
      </div>
    </Card>
  );
}
