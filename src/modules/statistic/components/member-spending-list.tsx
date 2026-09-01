import { ChevronRight } from 'lucide-react';

import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import type { StatisticResult } from '@/modules/statistic/types/statistic';

type MemberSpendingListProps = {
  statistic: StatisticResult;
  onSelectMember: (memberId: string) => void;
};

export function MemberSpendingList({ statistic, onSelectMember }: MemberSpendingListProps) {
  const rows = [...statistic.memberBalances].filter((row) => row.paid > 0).sort((a, b) => b.paid - a.paid);
  const maxPaid = Math.max(1, ...rows.map((row) => row.paid));

  return (
    <Card>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Người thanh toán</h3>
      <div className="grid gap-3 xl:grid-cols-2">
        {rows.map((row) => (
          <button
            className="flex w-full flex-col gap-2 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-default)] px-4 py-3 text-left text-sm transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)]"
            key={row.memberId}
            onClick={() => onSelectMember(row.memberId)}
            type="button"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-[var(--color-text-primary)]">{row.nickname}</span>
              <span className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                {formatCurrency(row.paid)}
                <ChevronRight className="size-4 text-[var(--color-text-muted)]" />
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
              <div
                className="h-full rounded-full bg-[color-mix(in_srgb,var(--color-brand-primary)_70%,transparent)]"
                style={{ width: `${(row.paid / maxPaid) * 100}%` }}
              />
            </div>
          </button>
        ))}
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
            Chưa có dữ liệu chi tiêu để phân tích.
          </div>
        ) : null}
      </div>
    </Card>
  );
}
