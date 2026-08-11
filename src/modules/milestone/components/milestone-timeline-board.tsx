import { CalendarDays, CheckCircle2, Circle, CircleDollarSign, PencilLine, Plus } from 'lucide-react';

import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import type { TodoDocument } from '@/modules/todo/types/todo';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
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
  onEditTodo: (todo: TodoDocument) => void;
  onChangeTodoStatus: (todo: TodoDocument, status: TodoDocument['status']) => void;
  onOpenExpenseSheet: (milestone: MilestoneDocument) => void;
};

const milestoneStatusLabel: Record<MilestoneDocument['status'], string> = {
  upcoming: 'Sắp tới',
  in_progress: 'Đang làm',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

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

  return new Intl.DateTimeFormat('vi-VN', {
    month: 'long',
    year: 'numeric',
  })
    .format(date)
    .toUpperCase();
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
  onEditTodo,
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

  return (
    <div className="space-y-6">
      {milestones.map((milestone) => {
        const isSelected = milestone.id === selectedMilestoneId;
        const milestoneTodos = todos.filter((todo) => todo.milestoneId === milestone.id);
        const progress =
          milestone.todoCount > 0 ? Math.round((milestone.completedTodoCount / milestone.todoCount) * 100) : 0;
        const startDate = timestampToDate(milestone.startDate);
        const endDate = timestampToDate(milestone.endDate);
        const displayedStatus = getDisplayedMilestoneStatus(milestone);
        const anchorDate = getMilestoneAnchorDate(milestone);
        const monthLabel = formatMonthLabel(anchorDate);
        const shouldShowMonthLabel = monthLabel !== previousMonthLabel;
        previousMonthLabel = monthLabel;

        return (
          <div className="relative pl-12" key={milestone.id}>
            {shouldShowMonthLabel ? (
              <div className="relative mb-4 flex items-center gap-3">
                <span className="absolute -left-11 top-1 z-10 flex size-7 items-center justify-center rounded-full bg-white ring-4 ring-[#0050cb]/10">
                  <span className="size-3 rounded-full bg-[#0050cb]" />
                </span>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0050cb]">{monthLabel}</p>
              </div>
            ) : null}

            <span className="absolute left-4 top-0 bottom-0 z-0 w-px bg-[#e8edf7]" />

            <div className="relative">
              <span
                className={cn(
                  'absolute -left-[41px] top-1/2 z-10 flex size-[18px] -translate-y-1/2 items-center justify-center rounded-full border-4 bg-white',
                  isSelected ? 'border-[#0050cb]' : 'border-[#cfd8ea]',
                )}
              >
                <span className={cn('size-2 rounded-full', isSelected ? 'bg-[#0050cb]' : 'bg-[#8c97ad]')} />
              </span>

              <button
                className={cn(
                  'group relative z-[1] w-full rounded-[32px] border p-0 text-left transition',
                  isSelected
                    ? 'border-[#0f172a] bg-[#141a22] text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]'
                    : 'border-slate-200 bg-white text-slate-950 hover:border-slate-300 hover:shadow-[0_14px_40px_rgba(15,23,42,0.08)]',
                )}
                onClick={() => onSelect(milestone.id)}
                type="button"
              >
                <div className="space-y-4 p-5 sm:space-y-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2 sm:space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-2xl font-semibold">{milestone.title}</h3>
                        <Badge
                          variant={
                            displayedStatus === 'completed'
                              ? 'success'
                              : displayedStatus === 'cancelled'
                                ? 'neutral'
                                : 'info'
                          }
                        >
                          {milestoneStatusLabel[displayedStatus]}
                        </Badge>
                      </div>
                      <p className={cn('hidden text-sm leading-6 md:block', isSelected ? 'text-slate-300' : 'text-slate-600')}>
                        {milestone.description || 'Chưa có mô tả cho milestone này.'}
                      </p>
                      <div className={cn('hidden items-center gap-2 text-sm md:inline-flex', isSelected ? 'text-slate-300' : 'text-slate-600')}>
                        <CalendarDays className="size-4 shrink-0" />
                        <span>
                          {startDate ? formatDate(startDate) : 'Chưa đặt'} - {endDate ? formatDate(endDate) : 'Chưa đặt'}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-start gap-2">
                      <Button
                        className="lg:hidden"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenExpenseSheet(milestone);
                        }}
                        variant={isSelected ? 'secondary' : 'ghost'}
                      >
                        <CircleDollarSign className="size-4" />
                      </Button>
                      {canManagePlan ? (
                        <div className="hidden flex-wrap justify-end gap-2 lg:flex">
                          <Button
                            className={isSelected ? 'border border-slate-700 bg-transparent text-white hover:bg-slate-800' : ''}
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

                  <div className="grid grid-cols-2 gap-2 text-sm sm:gap-3 sm:grid-cols-3">
                    <div>
                      <p className={cn('text-[11px] uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.16em]', isSelected ? 'text-slate-400' : 'text-slate-400')}>
                        Chi tiêu
                      </p>
                      <p className={cn('mt-1 text-xl font-semibold sm:mt-2 sm:text-2xl', isSelected ? 'text-white' : 'text-[#0050cb]')}>
                        {formatCurrency(milestone.totalExpense)}
                      </p>
                    </div>
                    <div>
                      <p className={cn('text-[11px] uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.16em]', isSelected ? 'text-slate-400' : 'text-slate-400')}>
                        Tiến độ
                      </p>
                      <p className="mt-1 text-xl font-semibold sm:mt-2 sm:text-2xl">{progress}%</p>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-4 ml-4 space-y-3 border-l-2 border-[#edf1f8] pl-6">
              {milestoneTodos.length > 0 ? (
                milestoneTodos.map((todo) => {
                  const assignee = members.find((member) => member.id === todo.assigneeMemberId);
                  const dueDate = timestampToDate(todo.dueDate);
                  const isDone = todo.status === 'done';
                  const canToggle = canManagePlan && !isPlanClosed;

                  return (
                    <div
                      className="relative flex items-center justify-between gap-2 rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4"
                      key={todo.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditTodo(todo);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onEditTodo(todo);
                        }
                      }}
                    >
                      <span className="absolute -left-[35px] top-1/2 size-4 -translate-y-1/2 rounded-full bg-[#c8d1e4]" />
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-base font-semibold text-slate-950">{todo.title}</p>
                        <p className="text-sm text-slate-600">
                          {assignee?.nickname ? `Phụ trách: ${assignee.nickname}` : dueDate ? `Hạn: ${formatDate(dueDate)}` : 'Chưa có người phụ trách'}
                        </p>
                      </div>
                      <button
                        aria-label={isDone ? 'Đánh dấu đang làm lại' : 'Đánh dấu hoàn thành'}
                        className={cn(
                          'flex size-9 shrink-0 items-center justify-center rounded-full border transition sm:size-10',
                          isDone
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-[#c4cbe0] text-slate-500 hover:border-[#0050cb]',
                        )}
                        disabled={!canToggle || isTodoSubmitting}
                        onClick={(event) => {
                          event.stopPropagation();
                          onChangeTodoStatus(todo, isDone ? 'in_progress' : 'done');
                        }}
                        type="button"
                      >
                        {isDone ? <CheckCircle2 className="size-4 sm:size-4.5" /> : <Circle className="size-4 sm:size-4.5" />}
                      </button>
                    </div>
                  );
                })
              ) : (
                <Card className="border-slate-100 bg-slate-50 text-slate-600 shadow-none">
                  <p className="text-sm leading-6">Milestone này chưa có todo nào.</p>
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
                THÊM TODO
              </button>

              {canManagePlan ? (
                <div className="flex flex-wrap justify-end gap-2 lg:hidden">
                  <Button
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditMilestone(milestone);
                    }}
                    variant="secondary"
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
