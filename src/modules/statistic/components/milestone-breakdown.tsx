import { ChevronRight } from 'lucide-react';

import { milestoneStatusLabel } from '@/modules/milestone/utils/milestone-status';
import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import type { StatisticResult } from '@/modules/statistic/types/statistic';

type MilestoneBreakdownProps = {
  statistic: StatisticResult;
  onSelectMilestoneMember: (milestoneId: string, memberId: string) => void;
};

export function MilestoneBreakdown({ statistic, onSelectMilestoneMember }: MilestoneBreakdownProps) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Theo mốc kế hoạch</h3>
      <div className="grid gap-3">
        {statistic.milestoneBreakdown.map((row) => (
          <div
            key={row.milestoneId}
            className="grid grid-cols-1 gap-3 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-default)] px-4 py-4 text-sm"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.5fr_1fr]">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[var(--color-text-primary)]">{row.milestoneTitle}</span>
                  <span className="rounded-full bg-[var(--color-surface-subtle)] px-2 py-1 text-xs text-[var(--color-text-secondary)]">
                    {milestoneStatusLabel[row.status]}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {row.completedTodoCount}/{row.todoCount} công việc hoàn thành · {row.expenseCount} khoản chi
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Đã chi</p>
                <p className="mt-1 font-semibold text-[var(--color-text-primary)]">{formatCurrency(row.totalAmount)}</p>
                {row.budgetAmount != null ? (
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">Ngân sách {formatCurrency(row.budgetAmount)}</p>
                ) : null}
              </div>
            </div>
            {row.memberBreakdown.length > 0 ? (
              <div className="grid gap-2 border-t border-[var(--color-border-subtle)] pt-3">
                {row.memberBreakdown.map((member) => (
                  <button
                    className="flex w-full items-center justify-between gap-3 rounded-xl bg-[var(--color-surface-subtle)] px-3 py-2 text-left text-sm transition hover:bg-[color-mix(in_srgb,var(--color-surface-subtle)_72%,var(--color-surface-default))]"
                    key={member.memberId}
                    onClick={() => onSelectMilestoneMember(row.milestoneId, member.memberId)}
                    type="button"
                  >
                    <span className="text-[var(--color-text-secondary)]">{member.nickname}</span>
                    <span className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                      {formatCurrency(member.totalAmount)}
                      <ChevronRight className="size-4 text-[var(--color-text-muted)]" />
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {statistic.milestoneBreakdown.length === 0 ? (
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
            Chưa có mốc kế hoạch nào.
          </div>
        ) : null}
      </div>
    </Card>
  );
}
