import { useEffect, useMemo, useState } from 'react';
import { Paperclip, Tag, Users } from 'lucide-react';

import { Card } from '@/shared/components/ui/card';
import { DropdownSelect } from '@/shared/components/ui/dropdown-select';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate, formatTime } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import { cn } from '@/shared/utils/cn';
import { categoryIcons } from '@/modules/category/utils/category-icon';
import type { Category } from '@/modules/category/types/category';
import { ExpenseActivityLink } from '@/modules/expense/components/expense-activity-link';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import type { ExpenseDocument } from '@/modules/expense/types/expense';
import type { IncomeDocument } from '@/modules/income/types/income';
import type { TravelActivityDocument } from '@/modules/travel-activity/types/travel-activity';

type TimelineListProps = {
  planId: string;
  expenses: ExpenseDocument[];
  incomes: IncomeDocument[];
  members: PlanMemberDocument[];
  categories: Category[];
  emptyStateDescription?: string;
  milestones: MilestoneDocument[];
  travelActivities?: TravelActivityDocument[];
  selectedMilestoneId?: string | null;
  onSelectedMilestoneChange?: (milestoneId: string | null) => void;
  onSelectExpense: (expense: ExpenseDocument) => void;
  onSelectIncome: (income: IncomeDocument) => void;
  hideMilestoneFilter?: boolean;
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
  emptyStateDescription,
  milestones,
  travelActivities = [],
  selectedMilestoneId: selectedMilestoneIdProp,
  onSelectedMilestoneChange,
  onSelectExpense,
  onSelectIncome,
  hideMilestoneFilter = false,
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

  const entries = useMemo(
    () =>
      [
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
      ].sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime()),
    [filteredExpenses, filteredIncomes],
  );

  if (entries.length === 0) {
    return (
      <div className="space-y-4">
        {!hideMilestoneFilter ? (
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
        ) : null}
        <Card>
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            {emptyStateDescription ??
              `Chưa có khoản chi hoặc khoản thu nào${
                selectedMilestoneId !== 'all' ? ' trong mốc kế hoạch đang chọn' : ''
              }. Hãy thêm khoản đầu tiên chỉ trong vài giây.`}
          </p>
        </Card>
      </div>
    );
  }

  const groupedEntries = useMemo(() => {
    const grouped = entries.reduce<Map<string, TimelineEntry[]>>((accumulator, entry) => {
      const dayKey = formatDate(entry.timestamp);
      const dayEntries = accumulator.get(dayKey);

      if (dayEntries) {
        dayEntries.push(entry);
      } else {
        accumulator.set(dayKey, [entry]);
      }

      return accumulator;
    }, new Map<string, TimelineEntry[]>());

    return Array.from(grouped.entries());
  }, [entries]);

  return (
    <div className="space-y-5">
      {!hideMilestoneFilter ? (
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
      ) : null}
      <div className="space-y-8">
        {groupedEntries.map(([day, dayEntries]) => (
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
                    onSelectExpense={onSelectExpense}
                    planId={planId}
                    travelActivities={travelActivities}
                  />
                ) : (
                  <IncomeTimelineCard
                    categories={categories}
                    income={entry.data}
                    key={`income-${entry.id}`}
                    members={members}
                    milestones={milestones}
                    onSelectIncome={onSelectIncome}
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
  expense: ExpenseDocument;
  members: PlanMemberDocument[];
  categories: Category[];
  milestones: MilestoneDocument[];
  onSelectExpense: (expense: ExpenseDocument) => void;
  planId: string;
  travelActivities: TravelActivityDocument[];
};

function ExpenseTimelineCard({
  expense,
  members,
  categories,
  milestones,
  onSelectExpense,
  planId,
  travelActivities,
}: ExpenseTimelineCardProps) {
  const paidBy = members.find((member) => member.id === expense.paidByMemberId);
  const paidByLabel = expense.paymentSourceType === 'fund' ? 'Quỹ chung' : paidBy?.nickname || 'Không rõ';
  const category = categories.find((item) => item.id === expense.categoryId);
  const milestone = milestones.find((item) => item.id === expense.milestoneId);
  const spentAt = timestampToDate(expense.spentAt);
  const CategoryIcon = category?.icon ? categoryIcons[category.icon] ?? Tag : Tag;
  const iconColor = category?.iconColor ?? 'text-slate-600';

  return (
    <div className="relative flex items-start gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center pt-5">
        <span className="size-2 rounded-full bg-[var(--color-expense)]" />
      </span>
      <button
        className="min-w-0 flex-1 text-left"
        onClick={() => onSelectExpense(expense)}
        type="button"
      >
        <Card className="gap-1.5 rounded-2xl border-[var(--color-danger-soft)] bg-[var(--color-surface)] p-4 sm:rounded-[var(--radius-card)] sm:gap-2 sm:p-4 transition hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(23,32,51,0.08)]">
          <div className="flex items-center gap-2">
            <CategoryIcon className={cn('size-4 shrink-0', iconColor)} />
            <h3 className="text-base font-semibold text-[var(--color-foreground)]">{expense.title}</h3>
          </div>
          <p className="text-sm text-[var(--color-subtle)]">
            <span className="font-medium text-[var(--color-muted)]">{paidByLabel}</span> đã trả ·{' '}
            <span className="font-medium text-[var(--color-muted)]">
              {spentAt ? formatTime(spentAt) : '--:--'}
            </span>
          </p>
          <div className="flex items-center justify-between gap-2 sm:gap-3 sm:pt-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-[var(--color-subtle)] sm:gap-2 sm:text-xs">
              {milestone ? (
                <>
                  <span className="truncate">{milestone.title}</span>
                  <span className="text-[var(--color-border-strong)]">•</span>
                </>
              ) : null}
              <span className="flex shrink-0 items-center gap-1">
                <Users className="size-3.5" />
                {expense.participants.length}
              </span>
              {expense.attachments.length > 0 ? (
                <>
                  <span className="text-[var(--color-border-strong)]">•</span>
                  <span className="flex shrink-0 items-center gap-1">
                    <Paperclip className="size-3.5" />
                    {expense.attachments.length}
                  </span>
                </>
              ) : null}
              {expense.activityId ? (
                <>
                  <span className="text-[var(--color-border-strong)]">•</span>
                  <ExpenseActivityLink
                    expense={expense}
                    interactive={false}
                    planId={planId}
                    travelActivities={travelActivities}
                  />
                </>
              ) : null}
            </div>
            <p className="shrink-0 text-base font-bold text-[var(--color-expense)]">
              −{formatCurrency(expense.amount)}
            </p>
          </div>
        </Card>
      </button>
    </div>
  );
}

type IncomeTimelineCardProps = {
  income: IncomeDocument;
  members: PlanMemberDocument[];
  categories: Category[];
  milestones: MilestoneDocument[];
  onSelectIncome: (income: IncomeDocument) => void;
};

function IncomeTimelineCard({
  income,
  members,
  categories,
  milestones,
  onSelectIncome,
}: IncomeTimelineCardProps) {
  const contributor = members.find((member) => member.id === income.contributedByMemberId);
  const category = categories.find((item) => item.id === income.categoryId);
  const milestone = milestones.find((item) => item.id === income.milestoneId);
  const receivedAt = timestampToDate(income.receivedAt);
  const CategoryIcon = category?.icon ? categoryIcons[category.icon] ?? Tag : Tag;
  const iconColor = category?.iconColor ?? 'text-slate-600';

  return (
    <div className="relative flex items-start gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center pt-5">
        <span className="size-2 rounded-full bg-[var(--color-income)]" />
      </span>
      <button
        className="min-w-0 flex-1 text-left"
        onClick={() => onSelectIncome(income)}
        type="button"
      >
        <Card className="gap-1.5 rounded-2xl border-[var(--color-income-soft)] bg-[var(--color-income-soft)]/40 p-4 sm:rounded-[var(--radius-card)] sm:gap-2 sm:p-4 transition hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(23,32,51,0.08)]">
          <div className="flex items-center gap-2">
            <CategoryIcon className={cn('size-4 shrink-0', iconColor)} />
            <h3 className="text-base font-semibold text-[var(--color-foreground)]">{income.title}</h3>
          </div>
          <p className="text-sm text-[var(--color-subtle)]">
            <span className="font-medium text-[var(--color-muted)]">{contributor?.nickname || 'Không rõ'}</span> đã nạp ·{' '}
            <span className="font-medium text-[var(--color-muted)]">
              {receivedAt ? formatTime(receivedAt) : '--:--'}
            </span>
          </p>
          <div className="flex items-center justify-between gap-2 sm:gap-3 sm:pt-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-[var(--color-subtle)] sm:gap-2 sm:text-xs">
              {milestone ? <span className="truncate">{milestone.title}</span> : null}
            </div>
            <p className="shrink-0 text-base font-bold text-[var(--color-income)]">
              +{formatCurrency(income.amount)}
            </p>
          </div>
        </Card>
      </button>
    </div>
  );
}
