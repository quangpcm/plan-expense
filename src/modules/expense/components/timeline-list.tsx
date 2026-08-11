import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Landmark, Paperclip, Users } from 'lucide-react';

import { Card } from '@/shared/components/ui/card';
import { DropdownSelect } from '@/shared/components/ui/dropdown-select';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate, formatTime } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import type { CategoryDocument } from '@/modules/category/types/category';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import type { ExpenseDocument } from '@/modules/expense/types/expense';
import type { IncomeDocument } from '@/modules/income/types/income';

type TimelineListProps = {
  planId: string;
  expenses: ExpenseDocument[];
  incomes: IncomeDocument[];
  members: PlanMemberDocument[];
  categories: CategoryDocument[];
  milestones: MilestoneDocument[];
  selectedMilestoneId?: string | null;
  onSelectedMilestoneChange?: (milestoneId: string | null) => void;
};

type TimelineEntry =
  | { kind: 'expense'; id: string; timestamp: Date; data: ExpenseDocument }
  | { kind: 'income'; id: string; timestamp: Date; data: IncomeDocument };

export function TimelineList({
  planId,
  expenses,
  incomes,
  members,
  categories,
  milestones,
  selectedMilestoneId: selectedMilestoneIdProp,
  onSelectedMilestoneChange,
}: TimelineListProps) {
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(selectedMilestoneIdProp || 'all');

  useEffect(() => {
    setSelectedMilestoneId(selectedMilestoneIdProp || 'all');
  }, [selectedMilestoneIdProp]);

  const handleChangeMilestone = (milestoneId: string) => {
    setSelectedMilestoneId(milestoneId);
    onSelectedMilestoneChange?.(milestoneId === 'all' ? null : milestoneId);
  };

  const filteredExpenses = useMemo(
    () =>
      selectedMilestoneId === 'all'
        ? expenses
        : expenses.filter((expense) => expense.milestoneId === selectedMilestoneId),
    [expenses, selectedMilestoneId],
  );
  const filteredIncomes = useMemo(
    () =>
      selectedMilestoneId === 'all'
        ? incomes
        : incomes.filter((income) => income.milestoneId === selectedMilestoneId),
    [incomes, selectedMilestoneId],
  );

  const entries: TimelineEntry[] = [
    ...filteredExpenses.map((expense): TimelineEntry => ({
      kind: 'expense',
      id: expense.id,
      timestamp: timestampToDate(expense.spentAt) ?? new Date(0),
      data: expense,
    })),
    ...filteredIncomes.map((income): TimelineEntry => ({
      kind: 'income',
      id: income.id,
      timestamp: timestampToDate(income.receivedAt) ?? new Date(0),
      data: income,
    })),
  ];

  if (entries.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:max-w-xs">
          <label className="text-sm font-medium text-slate-700" htmlFor="timeline-milestone-filter">
            Mốc kế hoạch
          </label>
          <DropdownSelect
            id="timeline-milestone-filter"
            onValueChange={handleChangeMilestone}
            options={[
              { value: 'all', label: 'Tất cả các mốc' },
              ...milestones.map((milestone) => ({ value: milestone.id, label: milestone.title })),
            ]}
            value={selectedMilestoneId}
          />
        </div>
        <Card>
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Chưa có khoản chi hoặc khoản thu nào
            {selectedMilestoneId !== 'all' ? ' trong mốc kế hoạch đang chọn' : ''}. Hãy thêm khoản đầu tiên chỉ trong vài giây.
          </p>
        </Card>
      </div>
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
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:max-w-xs">
        <label className="text-sm font-medium text-slate-700" htmlFor="timeline-milestone-filter">
          Mốc kế hoạch
        </label>
        <DropdownSelect
          id="timeline-milestone-filter"
          onValueChange={handleChangeMilestone}
          options={[
            { value: 'all', label: 'Tất cả các mốc' },
            ...milestones.map((milestone) => ({ value: milestone.id, label: milestone.title })),
          ]}
          value={selectedMilestoneId}
        />
      </div>
      <div className="space-y-8">
        {Object.entries(grouped).map(([day, dayEntries]) => (
          <div key={day} className="relative">
            <span className="absolute top-3 bottom-3 left-[11px] w-px bg-[var(--color-border-strong)]" />

            <div className="relative flex items-center gap-3 pb-4">
              <span className="flex size-6 shrink-0 items-center justify-center">
                <span className="size-3 rounded-full bg-[var(--color-primary)] ring-4 ring-[color:color-mix(in_srgb,var(--color-primary)_15%,white)]" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">{day}</p>
            </div>

            <div className="space-y-3">
              {dayEntries.map((entry) =>
                entry.kind === 'expense' ? (
                  <ExpenseTimelineCard
                    key={`expense-${entry.id}`}
                    categories={categories}
                    expense={entry.data}
                    members={members}
                    milestones={milestones}
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
    </div>
  );
}

type ExpenseTimelineCardProps = {
  planId: string;
  expense: ExpenseDocument;
  members: PlanMemberDocument[];
  categories: CategoryDocument[];
  milestones: MilestoneDocument[];
};

function ExpenseTimelineCard({ planId, expense, members, categories, milestones }: ExpenseTimelineCardProps) {
  const paidBy = members.find((member) => member.id === expense.paidByMemberId);
  const category = categories.find((item) => item.id === expense.categoryId);
  const milestone = milestones.find((item) => item.id === expense.milestoneId);
  const spentAt = timestampToDate(expense.spentAt);

  return (
    <div className="relative flex items-start gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center pt-5">
        <span className="size-2 rounded-full bg-[var(--color-expense)]" />
      </span>
      <Link
        className="min-w-0 flex-1"
        href={`/plans/${planId}/expenses/${expense.id}?returnTab=timeline${expense.milestoneId ? `&milestoneId=${expense.milestoneId}` : ''}`}
      >
        <Card className="gap-2 border-[var(--color-danger-soft)] bg-[var(--color-surface)] p-4 transition hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(23,32,51,0.08)]">
          <h3 className="text-base font-semibold text-[var(--color-foreground)]">{expense.title}</h3>
          <p className="text-sm text-[var(--color-subtle)]">
            <span className="font-medium text-[var(--color-muted)]">{paidBy?.nickname || 'Không rõ'}</span> đã trả ·{' '}
            <span className="font-medium text-[var(--color-muted)]">
              {spentAt ? formatTime(spentAt) : '--:--'}
            </span>
          </p>
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex min-w-0 items-center gap-2 text-xs text-[var(--color-subtle)]">
              <span className="truncate font-bold uppercase text-[var(--color-expense)]">
                {category?.name || 'Khác'}
              </span>
              {milestone ? (
                <>
                  <span className="text-[var(--color-border-strong)]">•</span>
                  <span className="truncate">{milestone.title}</span>
                </>
              ) : null}
              <span className="text-[var(--color-border-strong)]">•</span>
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
            <p className="shrink-0 text-base font-bold text-[var(--color-expense)]">
              −{formatCurrency(expense.amount)}
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
        <span className="size-2 rounded-full bg-[var(--color-income)]" />
      </span>
      <Link
        className="min-w-0 flex-1"
        href={`/plans/${planId}/incomes/${income.id}?returnTab=timeline${income.milestoneId ? `&milestoneId=${income.milestoneId}` : ''}`}
      >
        <Card className="gap-2 border-[var(--color-income-soft)] bg-[var(--color-income-soft)]/40 p-4 transition hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(23,32,51,0.08)]">
          <div className="flex items-center gap-2">
            <Landmark className="size-4 text-[var(--color-income)]" />
            <h3 className="text-base font-semibold text-[var(--color-foreground)]">{income.title}</h3>
          </div>
          <p className="text-sm text-[var(--color-subtle)]">
            <span className="font-medium text-[var(--color-muted)]">{contributor?.nickname || 'Không rõ'}</span> đã nạp ·{' '}
            <span className="font-medium text-[var(--color-muted)]">
              {receivedAt ? formatTime(receivedAt) : '--:--'}
            </span>
          </p>
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="truncate text-xs font-bold uppercase text-[var(--color-income)]">
              {category?.name || 'Khác'}
            </span>
            <p className="shrink-0 text-base font-bold text-[var(--color-income)]">
              +{formatCurrency(income.amount)}
            </p>
          </div>
        </Card>
      </Link>
    </div>
  );
}
