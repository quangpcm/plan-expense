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
  return (
    <Card className="gap-5 border-slate-200 bg-white shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#0050cb]">
            <CircleDollarSign className="size-3.5" />
            Khoản chi milestone
          </p>
          <h3 className="text-xl font-semibold text-slate-950">{milestone.title}</h3>
          <p className="text-sm leading-6 text-slate-600">
            Danh sách khoản chi đang gắn với milestone này qua `expense.milestoneId`.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge variant="info">{expenses.length} khoản chi</Badge>
          {canCreateExpense ? (
            <Button href={`/plans/${planId}/expenses/new?milestoneId=${milestone.id}`} variant="secondary">
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
              className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-slate-300 hover:bg-white"
              href={`/plans/${planId}/expenses/${expense.id}`}
              key={expense.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-semibold text-slate-950">{expense.title}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(timestampToDate(expense.spentAt) ?? new Date())}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-[#0050cb]">{formatCurrency(expense.amount)}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-slate-200 bg-slate-50 shadow-none">
          <p className="text-sm leading-6 text-slate-600">
            Milestone này chưa có khoản chi nào. Bạn có thể thêm khoản chi mới để gắn dòng tiền vào đúng giai đoạn.
          </p>
        </Card>
      )}

      {onShowTimeline ? (
        <div className="flex justify-end">
          <Button onClick={onShowTimeline} variant="ghost">
            <ReceiptText className="size-4" />
            Xem toàn bộ trên timeline
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
