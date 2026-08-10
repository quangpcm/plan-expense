import Link from 'next/link';
import { Landmark, Paperclip, Users } from 'lucide-react';

import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate, formatTime } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import type { CategoryDocument } from '@/modules/category/types/category';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { ExpenseDocument } from '@/modules/expense/types/expense';
import type { IncomeDocument } from '@/modules/income/types/income';

type TimelineListProps = {
  planId: string;
  expenses: ExpenseDocument[];
  incomes: IncomeDocument[];
  members: PlanMemberDocument[];
  categories: CategoryDocument[];
};

type TimelineEntry =
  | { kind: 'expense'; id: string; timestamp: Date; data: ExpenseDocument }
  | { kind: 'income'; id: string; timestamp: Date; data: IncomeDocument };

export function TimelineList({ planId, expenses, incomes, members, categories }: TimelineListProps) {
  const entries: TimelineEntry[] = [
    ...expenses.map((expense): TimelineEntry => ({
      kind: 'expense',
      id: expense.id,
      timestamp: timestampToDate(expense.spentAt) ?? new Date(0),
      data: expense,
    })),
    ...incomes.map((income): TimelineEntry => ({
      kind: 'income',
      id: income.id,
      timestamp: timestampToDate(income.receivedAt) ?? new Date(0),
      data: income,
    })),
  ];

  if (entries.length === 0) {
    return (
      <Card>
        <p className="text-sm leading-6 text-slate-600">
          Chưa có khoản chi hoặc khoản thu nào. Hãy thêm khoản đầu tiên chỉ trong vài giây.
        </p>
      </Card>
    );
  }

  const grouped = entries.reduce<Record<string, TimelineEntry[]>>((accumulator, entry) => {
    const dayKey = formatDate(entry.timestamp);
    accumulator[dayKey] ??= [];
    accumulator[dayKey].push(entry);
    return accumulator;
  }, {});

  Object.values(grouped).forEach((dayEntries) => {
    dayEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  });

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([day, dayEntries]) => (
        <div key={day} className="relative">
          <span className="absolute top-3 bottom-3 left-[11px] w-px bg-[#c2c6d8]" />

          <div className="relative flex items-center gap-3 pb-4">
            <span className="flex size-6 shrink-0 items-center justify-center">
              <span className="size-3 rounded-full bg-[#0050cb] ring-4 ring-[#0050cb]/15" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0050cb]">{day}</p>
          </div>

          <div className="space-y-3">
            {dayEntries.map((entry) =>
              entry.kind === 'expense' ? (
                <ExpenseTimelineCard
                  key={`expense-${entry.id}`}
                  categories={categories}
                  expense={entry.data}
                  members={members}
                  planId={planId}
                />
              ) : (
                <IncomeTimelineCard
                  key={`income-${entry.id}`}
                  categories={categories}
                  income={entry.data}
                  members={members}
                  planId={planId}
                />
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

type ExpenseTimelineCardProps = {
  planId: string;
  expense: ExpenseDocument;
  members: PlanMemberDocument[];
  categories: CategoryDocument[];
};

function ExpenseTimelineCard({ planId, expense, members, categories }: ExpenseTimelineCardProps) {
  const paidBy = members.find((member) => member.id === expense.paidByMemberId);
  const category = categories.find((item) => item.id === expense.categoryId);
  const spentAt = timestampToDate(expense.spentAt);

  return (
    <div className="relative flex items-start gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center pt-5">
        <span className="size-2 rounded-full bg-[#0050cb]" />
      </span>
      <Link className="min-w-0 flex-1" href={`/plans/${planId}/expenses/${expense.id}`}>
        <Card className="gap-2 p-4 transition hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
          <h3 className="text-base font-semibold text-[#191c1e]">{expense.title}</h3>
          <p className="text-sm text-[#727687]">
            Trả:{' '}
            <span className="font-medium text-[#424656]">{paidBy?.nickname || 'Không rõ'}</span> lúc{' '}
            <span className="font-medium text-[#424656]">
              {spentAt ? formatTime(spentAt) : '--:--'}
            </span>
          </p>
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex min-w-0 items-center gap-2 text-xs text-[#727687]">
              <span className="truncate font-bold uppercase text-[#0050cb]">
                {category?.name || 'Khác'}
              </span>
              <span className="text-[#c2c6d8]">•</span>
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
            <p className="shrink-0 text-base font-bold text-[#191c1e]">
              {formatCurrency(expense.amount)}
            </p>
          </div>
        </Card>
      </Link>
    </div>
  );
}

type IncomeTimelineCardProps = {
  planId: string;
  income: IncomeDocument;
  members: PlanMemberDocument[];
  categories: CategoryDocument[];
};

function IncomeTimelineCard({ planId, income, members, categories }: IncomeTimelineCardProps) {
  const contributor = members.find((member) => member.id === income.contributedByMemberId);
  const category = categories.find((item) => item.id === income.categoryId);
  const receivedAt = timestampToDate(income.receivedAt);

  return (
    <div className="relative flex items-start gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center pt-5">
        <span className="size-2 rounded-full bg-emerald-600" />
      </span>
      <Link className="min-w-0 flex-1" href={`/plans/${planId}/incomes/${income.id}`}>
        <Card className="gap-2 border-emerald-200 bg-emerald-50/40 p-4 transition hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2">
            <Landmark className="size-4 text-emerald-700" />
            <h3 className="text-base font-semibold text-[#191c1e]">{income.title}</h3>
          </div>
          <p className="text-sm text-[#727687]">
            Nạp:{' '}
            <span className="font-medium text-[#424656]">{contributor?.nickname || 'Không rõ'}</span> lúc{' '}
            <span className="font-medium text-[#424656]">
              {receivedAt ? formatTime(receivedAt) : '--:--'}
            </span>
          </p>
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="truncate text-xs font-bold uppercase text-emerald-700">
              {category?.name || 'Khác'}
            </span>
            <p className="shrink-0 text-base font-bold text-emerald-700">
              +{formatCurrency(income.amount)}
            </p>
          </div>
        </Card>
      </Link>
    </div>
  );
}
