import { CircleDollarSign, Paperclip, Plus, ReceiptText, Tag, Users } from 'lucide-react';

import type { Category } from '@/modules/category/types/category';
import { categoryIcons } from '@/modules/category/utils/category-icon';
import type { ExpenseDocument } from '@/modules/expense/types/expense';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import { Avatar } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { cn } from '@/shared/utils/cn';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateTime } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type MilestoneExpensePanelProps = {
  milestone: MilestoneDocument;
  expenses: ExpenseDocument[];
  members: PlanMemberDocument[];
  categories: Category[];
  canCreateExpense: boolean;
  onSelectExpense: (expense: ExpenseDocument) => void;
  onAddExpense: () => void;
  onShowTimeline?: () => void;
};

export function MilestoneExpensePanel({
  milestone,
  expenses,
  members,
  categories,
  canCreateExpense,
  onSelectExpense,
  onAddExpense,
  onShowTimeline,
}: MilestoneExpensePanelProps) {
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <Card className="gap-5 shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-primary)]">
            <CircleDollarSign className="size-3.5" />
            Khoản chi
          </p>
          <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">{milestone.title}</h3>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            {expenses.length} khoản chi · Tổng {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {canCreateExpense ? (
            <Button onClick={onAddExpense} variant="secondary">
              <Plus className="size-4" />
              Thêm khoản chi
            </Button>
          ) : null}
        </div>
      </div>

      {expenses.length > 0 ? (
        <div className="grid gap-3">
          {expenses.map((expense) => {
            const paidBy = members.find((member) => member.id === expense.paidByMemberId);
            const paidByLabel = expense.paymentSourceType === 'fund' ? 'Quỹ chung' : paidBy?.nickname ?? 'Không rõ';
            const category = categories.find((item) => item.id === expense.categoryId);
            const CategoryIcon = category?.icon ? categoryIcons[category.icon] ?? Tag : Tag;
            const iconColor = category?.iconColor ?? 'text-[var(--color-text-secondary)]';
            const spentAt = timestampToDate(expense.spentAt);

            return (
              <button
                className="w-full rounded-[24px] border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] px-4 py-4 text-left transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-default)]"
                key={expense.id}
                onClick={() => onSelectExpense(expense)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <CategoryIcon className={cn('size-4 shrink-0', iconColor)} />
                      <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{expense.title}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                      {/* <Avatar
                        className="size-5 shrink-0 text-[9px]"
                        initials={paidBy?.nickname.slice(0, 2).toUpperCase() ?? 'PE'}
                        src={paidBy?.avatarUrl ?? null}
                      /> */}
                      <span className="truncate">
                        <span className="font-medium text-[var(--color-text-muted)]">{paidByLabel}</span>{' '}
                        đã chi · {spentAt ? formatDateTime(spentAt) : '--'}
                      </span>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-[var(--color-expense)]">−{formatCurrency(expense.amount)}</p>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                  <span className="flex shrink-0 items-center gap-1">
                    <Users className="size-3.5" />
                    {expense.participants.length}
                  </span>
                  {expense.attachments.length > 0 ? (
                    <span className="flex shrink-0 items-center gap-1">
                      <Paperclip className="size-3.5" />
                      {expense.attachments.length}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <Card className="bg-[var(--color-surface-subtle)] shadow-none">
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
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
