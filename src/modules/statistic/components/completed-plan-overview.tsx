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
      title: 'Da doi soat hoan tat',
      description: 'Khong con khoan thanh toan giua cac thanh vien.',
      tone: 'success' as const,
      totalLabel: null,
    };
  }

  return {
    title: `Con ${unsettledRows.length} thanh vien can thanh toan`,
    description: 'Cac khoan can tra va can nhan van chua duoc xu ly het.',
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
      <Card className="gap-4 border border-slate-200 bg-slate-50/80">
        <div className="flex items-start gap-3">
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
              planStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            <CheckCircle2 className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-950">
              {planStatus === 'completed' ? 'Kế hoạch đã hoàn thành' : 'Kế hoạch đã dừng theo dõi'}
            </h3>
            <p className="text-sm leading-6 text-slate-600">
              {planStatus === 'completed'
                ? 'Tổng kết tài chính, tiến độ và đóng góp của các thành viên.'
                : 'Xem lại kết quả tài chính và các khoản cần xử lý trước khi lưu trữ.'}
            </p>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
              {planStatus === 'completed' ? 'HOÀN TẤT' : 'DỪNG THEO DÕI'} · {endedAtLabel}
            </p>
          </div>
        </div>
      </Card>

      <Card className="gap-3">
        <div className="flex items-center gap-2">
          <Scale className="size-4 text-slate-500" />
          <h3 className="text-lg font-semibold text-slate-950">Đối soát</h3>
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
          <CircleDollarSign className="size-4 text-slate-500" />
          <h3 className="text-lg font-semibold text-slate-950">Tổng kết nhanh</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Tổng chi</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{formatCurrency(statistic.overview.totalExpense)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Khoản chi</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{statistic.overview.expenseCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Users className="size-4" />
          <span>{statistic.overview.memberCount} thành viên</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="gap-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-950">Cân đối thành viên</h3>
          </div>
          <div className="grid gap-3">
            {balanceRows.map((row) => (
              <button
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                key={row.memberId}
                onClick={() => onSelectMember(row.memberId)}
                type="button"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 text-xs" initials={row.nickname.slice(0, 2).toUpperCase()} src={row.avatarUrl ?? null} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">{row.nickname}</p>
                      <p className={`text-sm ${row.adjustedBalance > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {row.adjustedBalance > 0 ? 'sẽ nhận' : 'cần trả'}
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
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Tất cả thành viên đã cân bằng.
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="gap-3">
          <h3 className="text-lg font-semibold text-slate-950">Người thanh toán</h3>
          <div className="grid gap-3">
            {payers.map((row) => (
              <button
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                key={row.memberId}
                onClick={() => onSelectMember(row.memberId)}
                type="button"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 text-xs" initials={row.nickname.slice(0, 2).toUpperCase()} src={row.avatarUrl ?? null} />
                  <div>
                    <p className="font-medium text-slate-900">{row.nickname}</p>
                    <p className="mt-1 text-sm text-slate-500">Đã thanh toán {formatCurrency(row.paid)}</p>
                  </div>
                </div>
              </button>
            ))}
            {payers.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Chưa có dữ liệu thanh toán.
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
