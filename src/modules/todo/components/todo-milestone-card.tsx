'use client';

import type { ReactNode } from 'react';
import { CalendarDays, CheckCircle2, Circle, Store, Wallet } from 'lucide-react';

import type { TodoDocument } from '@/modules/todo/types/todo';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { Avatar } from '@/shared/components/ui/avatar';
import { formatCompactCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import { cn } from '@/shared/utils/cn';
import { getSelectedTodoVendor, getTodoBudgetAmount } from '@/modules/todo/utils/todo-budget';

type TodoMilestoneCardProps = {
  todo: TodoDocument;
  assignee: PlanMemberDocument | null;
  canToggle: boolean;
  isSubmitting: boolean;
  dragHandle?: ReactNode;
  isPreview?: boolean;
  onView: (todo: TodoDocument) => void;
  onChangeStatus: (todo: TodoDocument, status: TodoDocument['status']) => void;
};

export function TodoMilestoneCard({
  todo,
  assignee,
  canToggle,
  isSubmitting,
  dragHandle,
  isPreview = false,
  onView,
  onChangeStatus,
}: TodoMilestoneCardProps) {
  const dueDate = timestampToDate(todo.dueDate);
  const isDone = todo.status === 'done';
  const selectedVendor = getSelectedTodoVendor(todo);
  const displayedBudget = getTodoBudgetAmount(todo);

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 transition-[transform,box-shadow,opacity] duration-200 sm:gap-3 sm:rounded-[24px] sm:px-4 sm:py-3.5',
        isPreview ? 'pointer-events-none scale-[1.03] shadow-[0_24px_54px_rgba(15,23,42,0.24)] ring-1 ring-[#dbe5f7]' : '',
      )}
      onClick={() => {
        if (!isPreview) {
          onView(todo);
        }
      }}
      onKeyDown={(event) => {
        if (!isPreview && (event.key === 'Enter' || event.key === ' ')) {
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
        <div className="flex flex-nowrap items-center gap-4 text-sm text-slate-600 sm:gap-5 sm:text-base">
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <CalendarDays className="size-4 text-slate-400 sm:size-5" />
            {dueDate ? formatDate(dueDate) : 'Chưa đặt'}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <Wallet className="size-4 text-slate-400 sm:size-5" />
            {displayedBudget != null ? formatCompactCurrency(displayedBudget) : 'Chưa đặt'}
          </span>
        </div>
        {selectedVendor ? (
          <div className="inline-flex max-w-full items-center gap-2 self-start rounded-full border border-[#bfd6ff] bg-[#eef5ff] px-2.5 py-1 text-[11px] font-medium text-[#4f6792] sm:px-3 sm:text-xs">
            <Store className="size-3 shrink-0 text-[#5e7fb8]" />
            <span className="truncate text-[#2f518f]">{selectedVendor.name}</span>
            {displayedBudget != null ? (
              <span className="shrink-0 text-[#6b84b1]">· {formatCompactCurrency(displayedBudget)}</span>
            ) : null}
          </div>
        ) : null}
      </div>
      {dragHandle ? <div className="shrink-0">{dragHandle}</div> : null}
      <button
        aria-label={isDone ? 'Đánh dấu đang làm lại' : 'Đánh dấu hoàn thành'}
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full border transition sm:size-9',
          isDone
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-[#c4cbe0] text-slate-500 hover:border-[#0050cb]',
        )}
        disabled={!canToggle || isSubmitting || isPreview}
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
