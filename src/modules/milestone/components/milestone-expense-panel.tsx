import Link from 'next/link';
import { CircleDollarSign, Plus, ReceiptText } from 'lucide-react';

import type { ExpenseDocument } from '@/modules/expense/types/expense';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type MilestoneExpensePanelProps = {
  planId: string;
  milestone: MilestoneDocument;
  expenses: ExpenseDocument[];
  canCreateExpense: boolean;
  onShowTimeline?: () => void;
};

export function MilestoneExpensePanel({
  planId,
  milestone,
  expenses,
  canCreateExpense,
  onShowTimeline,
}: MilestoneExpensePanelProps) {
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <Card className="gap-5 shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            <CircleDollarSign className="size-3.5" />
            Khoản chi
          </p>
          <h3 className="text-xl font-semibold text-slate-950">{milestone.title}</h3>
          <p className="text-sm font-medium text-slate-600">
            {expenses.length} khoản chi · Tổng {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {canCreateExpense ? (
            <Button href={`/plans/${planId}/expenses/new?milestoneId=${milestone.id}&returnTab=milestones`} variant="secondary">
              <Plus className="size-4" />
              Thêm khoản chi
            </Button>
          ) : null}
        </div>
      </div>

      {expenses.length > 0 ? (
        <div className="grid gap-3">
          {expenses.map((expense) => (
            <Link
              className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 py-4 transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface)]"
              href={`/plans/${planId}/expenses/${expense.id}?returnTab=milestones&milestoneId=${milestone.id}`}
              key={expense.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-semibold text-slate-950">{expense.title}</p>
                  <p className="text-xs text-[var(--color-subtle)]">
                    {formatDate(timestampToDate(expense.spentAt) ?? new Date())}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-[#c94f43]">−{formatCurrency(expense.amount)}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="bg-[var(--color-surface-soft)] shadow-none">
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Milestone này chưa có khoản chi nào. Bạn có thể thêm khoản chi mới để gắn dòng tiền vào đúng giai đoạn.
          </p>
        </Card>
      )}

      {onShowTimeline ? (
        <div className="flex justify-end">
          <Button onClick={onShowTimeline} variant="ghost">
            <ReceiptText className="size-4" />
            Xem trên dòng thời gian
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
