import Link from 'next/link';
import { Users } from 'lucide-react';

import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate, formatTime } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import type { CategoryDocument } from '@/modules/category/types/category';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { ExpenseDocument } from '@/modules/expense/types/expense';

type TimelineListProps = {
  planId: string;
  expenses: ExpenseDocument[];
  members: PlanMemberDocument[];
  categories: CategoryDocument[];
};

export function TimelineList({ planId, expenses, members, categories }: TimelineListProps) {
  if (expenses.length === 0) {
    return (
      <Card>
        <p className="text-sm leading-6 text-slate-600">Chưa có khoản chi nào. Hãy thêm khoản đầu tiên chỉ trong vài giây.</p>
      </Card>
    );
  }

  const grouped = expenses.reduce<Record<string, ExpenseDocument[]>>((accumulator, expense) => {
    const spentAt = timestampToDate(expense.spentAt);
    const dayKey = spentAt ? formatDate(spentAt) : 'Không rõ ngày';
    accumulator[dayKey] ??= [];
    accumulator[dayKey].push(expense);
    return accumulator;
  }, {});

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([day, dayExpenses]) => (
        <div key={day} className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{day}</p>
          <div className="grid gap-3">
            {dayExpenses.map((expense) => {
              const paidBy = members.find((member) => member.id === expense.paidByMemberId);
              const category = categories.find((item) => item.id === expense.categoryId);
              const spentAt = timestampToDate(expense.spentAt);

              return (
                <Link key={expense.id} className="block" href={`/plans/${planId}/expenses/${expense.id}`}>
                  <Card className="gap-3 transition hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-lg font-semibold text-slate-950">{expense.title}</h3>
                      <p className="text-lg font-semibold text-slate-950">{formatCurrency(expense.amount)}</p>
                    </div>
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold text-slate-800">{paidBy?.nickname || 'Không rõ'}</span> đã thanh
                      toán lúc{' '}
                      <span className="font-semibold text-slate-800">
                        {spentAt ? formatTime(spentAt) : '--:--'}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="info">{category?.name || 'Không có danh mục'}</Badge>
                      <Badge className="gap-1">
                        <Users className="size-3" />
                        {expense.participants.length}
                      </Badge>
                      {expense.attachments.length > 0 ? (
                        <Badge>{expense.attachments.length} tệp đính kèm</Badge>
                      ) : null}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
