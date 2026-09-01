import { CheckCircle2, CircleDollarSign, Scale, Users } from 'lucide-react';

import type { PlanStatus } from '@/modules/plan/types/plan';
import type { StatisticResult } from '@/modules/statistic/types/statistic';
import { Avatar } from '@/shared/components/ui/avatar';
import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';

type CompletedPlanOverviewProps = {
  endedAtLabel: string;
  onSelectMember: (memberId: string) => void;
  planStatus: PlanStatus;
  statistic: StatisticResult;
};

function getSettlementSummary(statistic: StatisticResult) {
  const unsettledRows = statistic.memberBalances.filter((row) => Math.abs(row.adjustedBalance) > 0);
  const totalReceivable = unsettledRows
    .filter((row) => row.adjustedBalance > 0)
    .reduce((sum, row) => sum + row.adjustedBalance, 0);

  if (unsettledRows.length === 0 || totalReceivable === 0) {
    return {
      title: 'Đã đối soát hoàn tất',
      description: 'Không còn khoản thanh toán giữa các thành viên.',
      tone: 'success' as const,
      totalLabel: null,
    };
  }

  return {
    title: `Còn ${unsettledRows.length} thành viên cần thanh toán`,
    description: 'Các khoản cần trả và nhận vẫn chưa được xử lý hết.',
    tone: 'warning' as const,
    totalLabel: formatCurrency(totalReceivable),
  };
}

function getBriefBalanceRows(statistic: StatisticResult) {
  return [...statistic.memberBalances]
    .filter((row) => Math.abs(row.adjustedBalance) > 0)
    .sort((a, b) => Math.abs(b.adjustedBalance) - Math.abs(a.adjustedBalance));
}

function getTopPayers(statistic: StatisticResult) {
  return [...statistic.memberBalances]
    .filter((row) => row.paid > 0)
    .sort((a, b) => b.paid - a.paid)
    .slice(0, 4);
}

export function CompletedPlanOverview({
  endedAtLabel,
  onSelectMember,
  planStatus,
  statistic,
}: CompletedPlanOverviewProps) {
  const settlement = getSettlementSummary(statistic);
  const balanceRows = getBriefBalanceRows(statistic);
  const payers = getTopPayers(statistic);

  return (
    <div className="space-y-4">
      <Card className="gap-4 border border-[var(--color-border-subtle)] bg-[color:color-mix(in_srgb,var(--color-surface-subtle)_80%,transparent)]">
        <div className="flex items-start gap-3">
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
              planStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            <CheckCircle2 className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {planStatus === 'completed' ? 'Kế hoạch đã hoàn thành' : 'Kế hoạch đã dừng theo dõi'}
            </h3>
            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
              {planStatus === 'completed'
                ? 'Tổng kết tài chính, tiến độ và đóng góp của các thành viên.'
                : 'Xem lại kết quả tài chính và các khoản cần xử lý trước khi lưu trữ.'}
            </p>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              {planStatus === 'completed' ? 'HOÀN TẤT' : 'DỪNG THEO DÕI'} · {endedAtLabel}
            </p>
          </div>
        </div>
      </Card>

      <Card className="gap-3">
        <div className="flex items-center gap-2">
          <Scale className="size-4 text-[var(--color-text-muted)]" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Đối soát</h3>
        </div>
        <div
          className={`rounded-2xl border px-4 py-4 ${
            settlement.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          <p className="text-sm font-semibold">{settlement.title}</p>
          <p className="mt-1 text-sm opacity-90">{settlement.description}</p>
          {settlement.totalLabel ? (
            <p className="mt-3 text-sm font-semibold">Tổng cần đối soát: {settlement.totalLabel}</p>
          ) : null}
        </div>
      </Card>

      <Card className="gap-3">
        <div className="flex items-center gap-2">
          <CircleDollarSign className="size-4 text-[var(--color-text-muted)]" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Tổng kết nhanh</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-default)] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Tổng chi</p>
            <p className="mt-2 text-lg font-semibold text-[var(--color-text-primary)]">{formatCurrency(statistic.overview.totalExpense)}</p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-default)] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Khoản chi</p>
            <p className="mt-2 text-lg font-semibold text-[var(--color-text-primary)]">{statistic.overview.expenseCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Users className="size-4" />
          <span>{statistic.overview.memberCount} thành viên</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="gap-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-[var(--color-text-muted)]" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Cân đối thành viên</h3>
          </div>
          <div className="grid gap-3">
            {balanceRows.map((row) => (
              <button
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-default)] px-4 py-3 text-left transition hover:border-[var(--color-border-default)] hover:bg-[var(--color-surface-subtle)]"
                key={row.memberId}
                onClick={() => onSelectMember(row.memberId)}
                type="button"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 text-xs" initials={row.nickname.slice(0, 2).toUpperCase()} src={row.avatarUrl ?? null} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[var(--color-text-primary)]">{row.nickname}</p>
                      <p className={`text-sm ${row.adjustedBalance > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {row.adjustedBalance > 0 ? 'còn nhận' : 'cần trả'}
                      </p>
                    </div>
                  </div>
                </div>
                <p className={`text-sm font-semibold ${row.adjustedBalance > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {row.adjustedBalance > 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(row.adjustedBalance))}
                </p>
              </button>
            ))}
            {balanceRows.length === 0 ? (
              <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                Tất cả thành viên đã cân bằng.
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="gap-3">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Người thanh toán</h3>
          <div className="grid gap-3">
            {payers.map((row) => (
              <button
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-default)] px-4 py-3 text-left transition hover:border-[var(--color-border-default)] hover:bg-[var(--color-surface-subtle)]"
                key={row.memberId}
                onClick={() => onSelectMember(row.memberId)}
                type="button"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 text-xs" initials={row.nickname.slice(0, 2).toUpperCase()} src={row.avatarUrl ?? null} />
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">{row.nickname}</p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">Đã thanh toán {formatCurrency(row.paid)}</p>
                  </div>
                </div>
              </button>
            ))}
            {payers.length === 0 ? (
              <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                Chưa có dữ liệu thanh toán.
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
