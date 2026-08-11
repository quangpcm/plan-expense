import { CalendarDays, CircleDollarSign, PencilLine, Plus } from 'lucide-react';

import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import { TodoMilestoneCard } from '@/modules/todo/components/todo-milestone-card';
import type { TodoDocument } from '@/modules/todo/types/todo';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { formatCompactCurrency, formatCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import { cn } from '@/shared/utils/cn';

type MilestoneTimelineBoardProps = {
  milestones: MilestoneDocument[];
  todos: TodoDocument[];
  members: PlanMemberDocument[];
  selectedMilestoneId: string | null;
  canManagePlan: boolean;
  isPlanClosed: boolean;
  isMilestoneSubmitting: boolean;
  isTodoSubmitting: boolean;
  onSelect: (milestoneId: string) => void;
  onEditMilestone: (milestone: MilestoneDocument) => void;
  onAddTodo: (milestone: MilestoneDocument) => void;
  onViewTodo: (todo: TodoDocument) => void;
  onChangeTodoStatus: (todo: TodoDocument, status: TodoDocument['status']) => void;
  onOpenExpenseSheet: (milestone: MilestoneDocument) => void;
};

const milestoneStatusLabel: Record<MilestoneDocument['status'], string> = {
  upcoming: 'Sắp tới',
  in_progress: 'Đang diễn ra',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

function getMilestoneCardTone(displayedStatus: MilestoneDocument['status'], isSelected: boolean) {
  if (isSelected) {
    return {
      card: 'border-[var(--color-milestone-selected-border)] bg-[var(--color-milestone-selected)] text-[var(--color-milestone-selected-foreground)] shadow-[0_24px_70px_rgba(36,59,107,0.22)]',
      titleMuted: 'text-[var(--color-milestone-selected-muted)]',
      valueStrong: 'text-[var(--color-milestone-selected-foreground)]',
      valueSoft: 'text-[var(--color-milestone-selected-muted)]',
      action: 'border border-white/20 bg-white/8 text-white hover:bg-white/14',
      mobileExpenseAction: 'secondary' as const,
    };
  }

  if (displayedStatus === 'completed') {
    return {
      card: 'border-[var(--color-milestone-completed-border)] bg-[var(--color-milestone-completed)] text-[var(--color-milestone-completed-foreground)] hover:shadow-[0_14px_40px_rgba(36,92,73,0.08)]',
      titleMuted: 'text-[var(--color-milestone-completed-muted)]',
      valueStrong: 'text-[var(--color-milestone-completed-foreground)]',
      valueSoft: 'text-[var(--color-milestone-completed-muted)]',
      action: 'bg-white/80 text-[var(--color-milestone-completed-foreground)] hover:bg-white',
      mobileExpenseAction: 'ghost' as const,
    };
  }

  return {
    card: 'border-[var(--color-milestone-upcoming-border)] bg-[var(--color-milestone-upcoming)] text-[var(--color-milestone-upcoming-foreground)] hover:border-[var(--color-border-strong)] hover:shadow-[0_14px_40px_rgba(15,23,42,0.08)]',
    titleMuted: 'text-[var(--color-milestone-upcoming-muted)]',
    valueStrong: 'text-[var(--color-primary)]',
    valueSoft: 'text-[var(--color-milestone-upcoming-muted)]',
    action: '',
    mobileExpenseAction: 'ghost' as const,
  };
}

function getMilestoneBadgeClass(displayedStatus: MilestoneDocument['status']) {
  if (displayedStatus === 'completed') {
    return 'bg-[var(--color-success-soft)] text-[#047857]';
  }

  if (displayedStatus === 'cancelled') {
    return 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]';
  }

  return 'bg-[var(--color-info-soft)] text-[var(--color-info)]';
}

function getDisplayedMilestoneStatus(milestone: MilestoneDocument): MilestoneDocument['status'] {
  if (milestone.status === 'cancelled' || milestone.status === 'completed') {
    return milestone.status;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = timestampToDate(milestone.startDate);
  const endDate = timestampToDate(milestone.endDate);
  const normalizedStartDate = startDate
    ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
    : null;
  const normalizedEndDate = endDate
    ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
    : null;

  if (normalizedStartDate && today < normalizedStartDate) {
    return 'upcoming';
  }

  if (normalizedEndDate && today > normalizedEndDate) {
    return 'completed';
  }

  if (normalizedStartDate || normalizedEndDate) {
    return 'in_progress';
  }

  return milestone.status;
}

function getMilestoneAnchorDate(milestone: MilestoneDocument) {
  return timestampToDate(milestone.startDate) ?? timestampToDate(milestone.endDate) ?? timestampToDate(milestone.createdAt);
}

function formatMonthLabel(date: Date | null) {
  if (!date) {
    return 'CHƯA ĐẶT THỜI GIAN';
  }

  return `THÁNG ${date.getMonth() + 1} · ${date.getFullYear()}`;
}

export function MilestoneTimelineBoard({
  milestones,
  todos,
  members,
  selectedMilestoneId,
  canManagePlan,
  isPlanClosed,
  isMilestoneSubmitting,
  isTodoSubmitting,
  onSelect,
  onEditMilestone,
  onAddTodo,
  onViewTodo,
  onChangeTodoStatus,
  onOpenExpenseSheet,
}: MilestoneTimelineBoardProps) {
  if (milestones.length === 0) {
    return (
      <Card className="border-slate-200 bg-slate-50 shadow-none">
        <p className="text-sm leading-6 text-slate-600">
          Chưa có mốc kế hoạch nào. Hãy tạo mốc đầu tiên để bắt đầu tổ chức kế hoạch theo giai đoạn.
        </p>
      </Card>
    );
  }

  let previousMonthLabel: string | null = null;
  const selectedMilestone = milestones.find((milestone) => milestone.id === selectedMilestoneId) ?? null;
  const selectedMonthLabel = selectedMilestone ? formatMonthLabel(getMilestoneAnchorDate(selectedMilestone)) : null;

  return (
    <div className="space-y-6">
      {milestones.map((milestone) => {
        const isSelected = milestone.id === selectedMilestoneId;
        const milestoneTodos = todos.filter((todo) => todo.milestoneId === milestone.id);
        const estimatedBudget = milestoneTodos.reduce((total, todoItem) => total + (todoItem.budget ?? 0), 0);
        const startDate = timestampToDate(milestone.startDate);
        const endDate = timestampToDate(milestone.endDate);
        const displayedStatus = getDisplayedMilestoneStatus(milestone);
        const anchorDate = getMilestoneAnchorDate(milestone);
        const monthLabel = formatMonthLabel(anchorDate);
        const shouldShowMonthLabel = monthLabel !== previousMonthLabel;
        const isMonthSelected = selectedMonthLabel !== null && monthLabel === selectedMonthLabel;
        const tone = getMilestoneCardTone(displayedStatus, isSelected);
        previousMonthLabel = monthLabel;

        return (
          <div className="relative pl-8 sm:pl-12" key={milestone.id}>
            {shouldShowMonthLabel ? (
              <div className="relative mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
                <span
                  className={cn(
                    'absolute -left-8 top-1 z-10 flex size-6 items-center justify-center rounded-full bg-white ring-2 sm:-left-11 sm:size-7 sm:ring-4',
                    isMonthSelected ? 'ring-[#0050cb]/10' : 'ring-slate-100',
                  )}
                >
                  <span className={cn('size-2.5 rounded-full sm:size-3', isMonthSelected ? 'bg-[#0050cb]' : 'bg-slate-300')} />
                </span>
                <p
                  className={cn(
                    'text-[11px] font-semibold uppercase tracking-[0.14em] sm:text-xs sm:tracking-[0.22em]',
                    isMonthSelected ? 'text-[#0050cb]' : 'text-slate-400',
                  )}
                >
                  {monthLabel}
                </p>
              </div>
            ) : null}

            <span className="absolute left-[11px] top-0 bottom-0 z-0 w-px bg-[#e8edf7] sm:left-4" />

            <div className="relative">
              <span
                className={cn(
                  'absolute -left-[27px] top-1/2 z-10 flex size-3 -translate-y-1/2 items-center justify-center rounded-full border-[3px] bg-white sm:-left-[41px] sm:size-[18px] sm:border-4',
                  isSelected
                    ? 'border-[var(--color-primary)]'
                    : displayedStatus === 'completed'
                      ? 'border-[var(--color-milestone-completed-border)]'
                      : 'border-[#cfd8ea]',
                )}
              >
                <span
                  className={cn(
                    'size-1.5 rounded-full sm:size-2',
                    isSelected
                      ? 'bg-[var(--color-primary)]'
                      : displayedStatus === 'completed'
                        ? 'bg-[var(--color-success)]'
                        : 'bg-[#8c97ad]',
                  )}
                />
              </span>

              <button
                className={cn(
                  'group relative z-[1] w-full rounded-[20px] border p-0 text-left transition sm:rounded-[32px]',
                  tone.card,
                )}
                onClick={() => onSelect(milestone.id)}
                type="button"
              >
                <div className="space-y-3 p-4 sm:space-y-5 sm:p-6">
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="min-w-0 space-y-2 sm:space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-xl font-semibold sm:text-2xl">{milestone.title}</h3>
                        <Badge className={getMilestoneBadgeClass(displayedStatus)}>
                          {milestoneStatusLabel[displayedStatus]}
                        </Badge>
                      </div>
                      <p className={cn('hidden text-sm leading-6 md:block', tone.titleMuted)}>
                        {milestone.description || 'Chưa có mô tả cho milestone này.'}
                      </p>
                      <div className={cn('hidden items-center gap-2 text-sm md:inline-flex', tone.titleMuted)}>
                        <CalendarDays className="size-4 shrink-0" />
                        <span>
                          {startDate ? formatDate(startDate) : 'Chưa đặt'} - {endDate ? formatDate(endDate) : 'Chưa đặt'}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-start gap-2">
                      <Button
                        className="size-9 min-h-9 justify-center px-0 lg:hidden"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenExpenseSheet(milestone);
                        }}
                        variant={tone.mobileExpenseAction}
                      >
                        <CircleDollarSign className="size-4" />
                      </Button>
                      {canManagePlan ? (
                        <div className="hidden flex-wrap justify-end gap-2 lg:flex">
                          <Button
                            className={tone.action}
                            onClick={(event) => {
                              event.stopPropagation();
                              onEditMilestone(milestone);
                            }}
                            variant={isSelected ? 'ghost' : 'secondary'}
                          >
                            <PencilLine className="size-4" />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm sm:gap-3">
                    <div>
                      <p className={cn('text-[11px] uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.16em]', tone.titleMuted)}>
                        Đã chi
                      </p>
                      <p className={cn('mt-1 text-lg font-semibold sm:mt-2 sm:text-2xl', tone.valueStrong)}>
                        {formatCompactCurrency(milestone.totalExpense)}
                      </p>
                    </div>
                    <div>
                      <p className={cn('text-[11px] uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.16em]', tone.titleMuted)}>
                        Dự kiến chi
                      </p>
                      <p className={cn('mt-1 text-lg font-semibold sm:mt-2 sm:text-2xl', tone.valueSoft)}>
                        {formatCompactCurrency(estimatedBudget)}
                      </p>
                    </div>
                    <div>
                      <p className={cn('text-[11px] uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.16em]', tone.titleMuted)}>
                        Công việc
                      </p>
                      <p className="mt-1 text-lg font-semibold sm:mt-2 sm:text-2xl">
                        {milestone.completedTodoCount}/{milestone.todoCount}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-3 ml-[11px] space-y-2 border-l-2 border-[#edf1f8] pl-4 sm:mt-4 sm:ml-4 sm:space-y-3 sm:pl-6">
              {milestoneTodos.length > 0 ? (
                milestoneTodos.map((todo) => {
                  const assignee = members.find((member) => member.id === todo.assigneeMemberId) ?? null;
                  const canToggle = canManagePlan && !isPlanClosed;

                  return (
                    <div className="relative" key={todo.id} onClick={(event) => event.stopPropagation()}>
                      <span className="absolute -left-[23px] top-1/2 size-3 -translate-y-1/2 rounded-full bg-[#c8d1e4] sm:-left-[35px] sm:size-4" />
                      <TodoMilestoneCard
                        assignee={assignee}
                        canToggle={canToggle}
                        isSubmitting={isTodoSubmitting}
                        onChangeStatus={onChangeTodoStatus}
                        onView={onViewTodo}
                        todo={todo}
                      />
                    </div>
                  );
                })
              ) : (
                <Card className="border-slate-100 bg-slate-50 text-slate-600 shadow-none">
                  <p className="text-sm leading-2">Milestone này chưa có todo nào.</p>
                </Card>
              )}

              <button
                className={cn(
                  'flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] px-4 py-2.5 text-sm font-semibold transition',
                  canManagePlan && !isPlanClosed
                    ? 'bg-transparent text-slate-600 hover:bg-white hover:text-[#0050cb]'
                    : 'cursor-not-allowed bg-transparent text-slate-400',
                )}
                disabled={!canManagePlan || isPlanClosed}
                onClick={(event) => {
                  event.stopPropagation();
                  onAddTodo(milestone);
                }}
                type="button"
              >
                <Plus className="size-5" />
                Thêm công việc
              </button>

              {canManagePlan ? (
                <div className="flex flex-wrap justify-end gap-2 lg:hidden">
                  <Button
                    className={isSelected ? tone.action : ''}
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditMilestone(milestone);
                    }}
                    variant={isSelected ? 'ghost' : 'secondary'}
                  >
                    <PencilLine className="size-4" />
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
