'use client';

import { CalendarDays, CheckCircle2, Circle, Wallet } from 'lucide-react';

import type { TodoDocument } from '@/modules/todo/types/todo';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { Avatar } from '@/shared/components/ui/avatar';
import { formatCompactCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import { cn } from '@/shared/utils/cn';

type TodoMilestoneCardProps = {
  todo: TodoDocument;
  assignee: PlanMemberDocument | null;
  canToggle: boolean;
  isSubmitting: boolean;
  onView: (todo: TodoDocument) => void;
  onChangeStatus: (todo: TodoDocument, status: TodoDocument['status']) => void;
};

export function TodoMilestoneCard({
  todo,
  assignee,
  canToggle,
  isSubmitting,
  onView,
  onChangeStatus,
}: TodoMilestoneCardProps) {
  const dueDate = timestampToDate(todo.dueDate);
  const isDone = todo.status === 'done';

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 sm:gap-3 sm:rounded-[24px] sm:px-4 sm:py-3.5"
      onClick={() => onView(todo)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onView(todo);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <Avatar
        className="size-9 text-sm sm:size-10"
        initials={assignee?.nickname.slice(0, 2).toUpperCase() ?? 'PE'}
        src={assignee?.avatarUrl ?? null}
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-base font-semibold text-slate-950 sm:text-lg">{todo.title}</p>
        <div className="flex flex-nowrap items-center gap-2 text-sm text-slate-600 sm:gap-3 sm:text-base">
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <CalendarDays className="size-4 text-slate-400 sm:size-5" />
            {dueDate ? formatDate(dueDate) : 'Chưa đặt'}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <Wallet className="size-4 text-slate-400 sm:size-5" />
            {todo.budget != null ? formatCompactCurrency(todo.budget) : 'Chưa đặt'}
          </span>
        </div>
      </div>
      <button
        aria-label={isDone ? 'Đánh dấu đang làm lại' : 'Đánh dấu hoàn thành'}
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full border transition sm:size-9',
          isDone
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-[#c4cbe0] text-slate-500 hover:border-[#0050cb]',
        )}
        disabled={!canToggle || isSubmitting}
        onClick={(event) => {
          event.stopPropagation();
          onChangeStatus(todo, isDone ? 'in_progress' : 'done');
        }}
        type="button"
      >
        {isDone ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
      </button>
    </div>
  );
}
