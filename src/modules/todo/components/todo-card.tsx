'use client';

import { useState } from 'react';
import { CheckCircle2, CircleAlert, Clock3, PencilLine, Plus, Trash2, Wallet } from 'lucide-react';
import type { MouseEvent } from 'react';

import type { TodoDocument } from '@/modules/todo/types/todo';
import { priorityLabel, statusLabel, toVendorHref } from '@/modules/todo/utils/todo-display';
import { getSelectedTodoVendor, getTodoBudgetAmount } from '@/modules/todo/utils/todo-budget';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import { AttachmentGallery } from '@/modules/storage';
import { Avatar } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { cn } from '@/shared/utils/cn';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDueCountdown, getDueUrgency } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type TodoCardProps = {
  todo: TodoDocument;
  assignee: PlanMemberDocument | null;
  milestone: MilestoneDocument | null;
  canManagePlan: boolean;
  isSubmitting: boolean;
  onEdit: (todo: TodoDocument) => void;
  onChangeStatus: (todo: TodoDocument, status: TodoDocument['status']) => void;
  onAddVendor: (todo: TodoDocument) => void;
  onDeleteTodo: (todo: TodoDocument) => void;
};

function stopPropagation(event: MouseEvent) {
  event.stopPropagation();
}

export function TodoCard({
  todo,
  assignee,
  milestone,
  canManagePlan,
  isSubmitting,
  onEdit,
  onChangeStatus,
  onAddVendor,
  onDeleteTodo,
}: TodoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dueDate = timestampToDate(todo.dueDate);
  const dueUrgency = dueDate ? getDueUrgency(dueDate) : null;
  const selectedVendor = getSelectedTodoVendor(todo);
  const displayedBudget = getTodoBudgetAmount(todo);

  function toggleExpanded() {
    setIsExpanded((value) => !value);
  }

  return (
    <Card
      className="cursor-pointer gap-4 border-slate-200 bg-white shadow-none transition hover:border-slate-300"
      onClick={toggleExpanded}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleExpanded();
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

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
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
            {formatCurrency(displayedBudget)}
          </span>
        ) : null}
      </div>

      {selectedVendor ? (
        <p className="text-sm text-slate-600">
          Đã chọn dịch vụ: <span className="font-medium text-slate-900">{selectedVendor.name}</span>
          {displayedBudget != null ? ` · ${formatCurrency(displayedBudget)}` : ''}
        </p>
      ) : null}

      {isExpanded ? (
        <div className="space-y-4" onClick={stopPropagation}>
          {todo.attachments.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Hình ảnh</p>
              <AttachmentGallery attachments={todo.attachments} />
            </div>
          ) : null}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Nhà cung cấp</p>
            {todo.vendors.length > 0 ? (
              <ul className="space-y-2">
                {todo.vendors.map((vendor) => (
                  <li className="space-y-1 rounded-2xl bg-slate-50 px-4 py-2.5 text-sm" key={vendor.id}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate font-medium text-slate-900">
                        {vendor.link ? (
                          <a
                            className="text-sky-700 hover:underline"
                            href={toVendorHref(vendor.link)}
                            onClick={stopPropagation}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {vendor.name}
                          </a>
                        ) : (
                          vendor.name
                        )}
                      </span>
                      <span className="shrink-0 text-slate-600">{formatCurrency(vendor.price)}</span>
                    </div>
                    {vendor.description ? (
                      <p className="line-clamp-2 text-xs leading-5 text-slate-500">{vendor.description}</p>
                    ) : null}
                    {vendor.attachments.length > 0 ? (
                      <AttachmentGallery attachments={vendor.attachments} size="sm" />
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Chưa có nhà cung cấp nào.</p>
            )}
            {canManagePlan ? (
              <Button
                className="w-full justify-center"
                onClick={(event) => {
                  event.stopPropagation();
                  onAddVendor(todo);
                }}
                variant="ghost"
              >
                <Plus className="size-4" />
                Thêm
              </Button>
            ) : null}
          </div>

          {canManagePlan ? (
            <div className="flex flex-nowrap items-center justify-end gap-2">
              {todo.status !== 'done' ? (
                <Button
                  className="px-4"
                  disabled={isSubmitting}
                  onClick={(event) => {
                    event.stopPropagation();
                    onChangeStatus(todo, 'done');
                  }}
                  variant="secondary"
                >
                  <CheckCircle2 className="size-4" />
                  Hoàn thành
                </Button>
              ) : (
                <Button
                  className="px-4"
                  disabled={isSubmitting}
                  onClick={(event) => {
                    event.stopPropagation();
                    onChangeStatus(todo, 'in_progress');
                  }}
                  variant="secondary"
                >
                  <Clock3 className="size-4" />
                  Đang làm lại
                </Button>
              )}
              <Button
                className="px-4"
                disabled={isSubmitting}
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(todo);
                }}
                variant="secondary"
              >
                <PencilLine className="size-4" />
                Sửa
              </Button>
              <Button
                aria-label="Xóa công việc"
                className="size-9 min-h-9 shrink-0 justify-center px-0 text-rose-600 hover:bg-rose-50"
                disabled={isSubmitting}
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteTodo(todo);
                }}
                variant="ghost"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
