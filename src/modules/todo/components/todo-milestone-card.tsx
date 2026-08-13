'use client';

import type { PointerEvent as ReactPointerEvent } from 'react';
import { CheckCircle2, Circle, CircleAlert, Clock3, Store, Wallet } from 'lucide-react';

import type { TodoDocument } from '@/modules/todo/types/todo';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { Avatar } from '@/shared/components/ui/avatar';
import { formatCompactCurrency } from '@/shared/utils/currency';
import { formatDueCountdown, getDueUrgency } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import { cn } from '@/shared/utils/cn';
import { getSelectedTodoVendor, getTodoBudgetAmount } from '@/modules/todo/utils/todo-budget';

type TodoMilestoneCardProps = {
  todo: TodoDocument;
  assignee: PlanMemberDocument | null;
  canToggle: boolean;
  isSubmitting: boolean;
  onHoldPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  isPreview?: boolean;
  onView: (todo: TodoDocument) => void;
  onChangeStatus: (todo: TodoDocument, status: TodoDocument['status']) => void;
};

export function TodoMilestoneCard({
  todo,
  assignee,
  canToggle,
  isSubmitting,
  onHoldPointerDown,
  isPreview = false,
  onView,
  onChangeStatus,
}: TodoMilestoneCardProps) {
  const dueDate = timestampToDate(todo.dueDate);
  const isDone = todo.status === 'done';
  const dueUrgency = dueDate ? getDueUrgency(dueDate) : null;
  const selectedVendor = getSelectedTodoVendor(todo);
  const displayedBudget = getTodoBudgetAmount(todo);

  return (
    <div
      className={cn(
        'flex select-none items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 transition-[transform,box-shadow,opacity] duration-200 [-webkit-touch-callout:none] [-webkit-user-select:none] sm:gap-3 sm:rounded-[24px] sm:px-4 sm:py-3.5',
        isPreview ? 'pointer-events-none scale-[1.03] shadow-[0_24px_54px_rgba(15,23,42,0.24)] ring-1 ring-[#dbe5f7]' : '',
      )}
      onClick={() => {
        if (!isPreview) {
          onView(todo);
        }
      }}
      onContextMenu={onHoldPointerDown ? (event) => event.preventDefault() : undefined}
      onKeyDown={(event) => {
        if (!isPreview && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onView(todo);
        }
      }}
      onPointerDown={isPreview ? undefined : onHoldPointerDown}
      role="button"
      tabIndex={0}
    >
      <Avatar
        className="size-8 text-xs sm:size-9 sm:text-sm"
        initials={assignee?.nickname.slice(0, 2).toUpperCase() ?? 'PE'}
        src={assignee?.avatarUrl ?? null}
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-[15px] font-semibold text-slate-950 sm:text-lg">{todo.title}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-600 sm:gap-x-4 sm:text-base">
          {isDone ? (
            <span className="inline-flex shrink-0 items-center gap-1 font-medium text-[color:var(--color-success)]">
              Đã xong
            </span>
          ) : (
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1',
                (dueUrgency === 'overdue' || dueUrgency === 'danger') &&
                  'font-medium text-[color:var(--color-danger)]',
                dueUrgency === 'warning' && 'font-medium text-[color:var(--color-warning)]',
              )}
            >
              {dueUrgency === 'overdue' ? (
                <CircleAlert className="size-3 text-[color:var(--color-danger)] sm:size-5" />
              ) : (
                <Clock3
                  className={cn(
                    'size-3 sm:size-5',
                    dueUrgency === 'danger'
                      ? 'text-[color:var(--color-danger)]'
                      : dueUrgency === 'warning'
                        ? 'text-[color:var(--color-warning)]'
                        : 'text-slate-400',
                  )}
                />
              )}
              {dueDate ? formatDueCountdown(dueDate) : 'Chưa đặt'}
            </span>
          )}
          {displayedBudget != null ? (
            <span className="inline-flex shrink-0 items-center gap-1">
              <Wallet className="size-3 text-slate-400 sm:size-5" />
              {formatCompactCurrency(displayedBudget)}
            </span>
          ) : null}
          {todo.vendors.length > 0 ? (
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1',
                selectedVendor ? 'font-semibold text-[#2f518f]' : '',
              )}
            >
              <Store className={cn('size-3 sm:size-5', selectedVendor ? 'text-[#5e7fb8]' : 'text-slate-400')} />
              {todo.vendors.length}
            </span>
          ) : null}
        </div>
        {selectedVendor ? (
          <div className="inline-flex max-w-full items-center gap-2 self-start rounded-full border border-[#bfd6ff] bg-[#eef5ff] px-2.5 py-1 text-xs font-medium text-[#4f6792] sm:px-3">
            <Store className="size-3 shrink-0 text-[#5e7fb8]" />
            <span className="truncate text-[#2f518f]">{selectedVendor.name}</span>
            {displayedBudget != null ? (
              <span className="shrink-0 text-[#6b84b1]">· {formatCompactCurrency(displayedBudget)}</span>
            ) : null}
          </div>
        ) : null}
      </div>
      <button
        aria-label={isDone ? 'Đánh dấu đang làm lại' : 'Đánh dấu hoàn thành'}
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full border transition sm:size-8',
          isDone
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-[#c4cbe0] text-slate-500 hover:border-[#0050cb]',
        )}
        disabled={!canToggle || isSubmitting || isPreview}
        onClick={(event) => {
          event.stopPropagation();
          onChangeStatus(todo, isDone ? 'in_progress' : 'done');
        }}
        onPointerDown={(event) => event.stopPropagation()}
        type="button"
      >
        {isDone ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
      </button>
    </div>
  );
}
