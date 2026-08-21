'use client';

import { CircleAlert, Clock3, Paperclip, Wallet } from 'lucide-react';

import type { TodoDocument } from '@/modules/todo/types/todo';
import { priorityLabel, statusLabel } from '@/modules/todo/utils/todo-display';
import { getSelectedTodoVendor, getTodoBudgetAmount } from '@/modules/todo/utils/todo-budget';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import { Avatar } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { cn } from '@/shared/utils/cn';
import { formatCompactCurrency } from '@/shared/utils/currency';
import { formatDueCountdown, getDueUrgency } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type TodoCardProps = {
  todo: TodoDocument;
  assignee: PlanMemberDocument | null;
  milestone: MilestoneDocument | null;
  onViewTodo: (todo: TodoDocument) => void;
};

export function TodoCard({ todo, assignee, milestone, onViewTodo }: TodoCardProps) {
  const dueDate = timestampToDate(todo.dueDate);
  const dueUrgency = dueDate ? getDueUrgency(dueDate) : null;
  const selectedVendor = getSelectedTodoVendor(todo);
  const displayedBudget = getTodoBudgetAmount(todo);

  return (
    <Card
      className="cursor-pointer gap-4 border-slate-200 bg-white shadow-none transition hover:border-slate-300"
      onClick={() => onViewTodo(todo)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onViewTodo(todo);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start gap-3">
        <Avatar
          className="size-8 text-xs"
          initials={assignee?.nickname.slice(0, 2).toUpperCase() ?? 'PE'}
          src={assignee?.avatarUrl ?? null}
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="min-w-0 truncate text-base font-semibold text-slate-950">{todo.title}</h4>
            {milestone ? (
              <Badge className="shrink-0 px-2 py-0.5 text-[11px]" variant="neutral">
                {milestone.title}
              </Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge
              className="px-2 py-0.5 text-[11px]"
              variant={todo.status === 'done' ? 'success' : todo.status === 'cancelled' ? 'neutral' : 'info'}
            >
              {statusLabel[todo.status]}
            </Badge>
            <Badge className="px-2 py-0.5 text-[11px]" variant="neutral">
              {priorityLabel[todo.priority]}
            </Badge>
          </div>
        </div>
      </div>

      {todo.description ? (
        <p className="line-clamp-1 text-sm leading-6 text-slate-600">{todo.description}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
        <span
          className={cn(
            'inline-flex items-center gap-1.5',
            (dueUrgency === 'overdue' || dueUrgency === 'danger') && 'font-medium text-[color:var(--color-danger)]',
            dueUrgency === 'warning' && 'font-medium text-[color:var(--color-warning)]',
          )}
        >
          {dueUrgency === 'overdue' ? (
            <CircleAlert className="size-4 text-[color:var(--color-danger)]" />
          ) : (
            <Clock3
              className={cn(
                'size-4',
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
        {displayedBudget != null ? (
          <span className="inline-flex items-center gap-1.5">
            <Wallet className="size-4 text-slate-400" />
            {formatCompactCurrency(displayedBudget)}
          </span>
        ) : null}
        {todo.attachments.length > 0 ? (
          <span className="inline-flex items-center gap-1.5">
            <Paperclip className="size-4 text-slate-400" />
            {todo.attachments.length}
          </span>
        ) : null}
      </div>

      {selectedVendor ? (
        <p className="text-sm text-slate-600">
          Đã chọn dịch vụ: <span className="font-medium text-slate-900">{selectedVendor.name}</span>
          {displayedBudget != null ? ` · ${formatCompactCurrency(displayedBudget)}` : ''}
        </p>
      ) : null}
    </Card>
  );
}
