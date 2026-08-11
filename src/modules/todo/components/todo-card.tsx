'use client';

import { useState } from 'react';
import { CalendarDays, CheckCircle2, Circle, Clock3, PencilLine, Plus, Trash2, Wallet, XCircle } from 'lucide-react';
import type { MouseEvent } from 'react';

import type { TodoDocument } from '@/modules/todo/types/todo';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { Avatar } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type TodoCardProps = {
  todo: TodoDocument;
  assignee: PlanMemberDocument | null;
  canManagePlan: boolean;
  isSubmitting: boolean;
  onEdit: (todo: TodoDocument) => void;
  onChangeStatus: (todo: TodoDocument, status: TodoDocument['status']) => void;
  onAddVendor: (todo: TodoDocument) => void;
  onDeleteTodo: (todo: TodoDocument) => void;
};

const priorityLabel: Record<TodoDocument['priority'], string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
};

const statusLabel: Record<TodoDocument['status'], string> = {
  todo: 'Cần làm',
  in_progress: 'Đang làm',
  done: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

function toHref(link: string) {
  return link.startsWith('http://') || link.startsWith('https://') ? link : `https://${link}`;
}

function stopPropagation(event: MouseEvent) {
  event.stopPropagation();
}

export function TodoCard({
  todo,
  assignee,
  canManagePlan,
  isSubmitting,
  onEdit,
  onChangeStatus,
  onAddVendor,
  onDeleteTodo,
}: TodoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dueDate = timestampToDate(todo.dueDate);

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
          <h4 className="truncate text-base font-semibold text-slate-950">{todo.title}</h4>
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

      <p className="line-clamp-1 text-sm leading-6 text-slate-600">{todo.description || 'Chưa có mô tả.'}</p>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-4 text-slate-400" />
          {dueDate ? formatDate(dueDate) : 'Chưa đặt'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Wallet className="size-4 text-slate-400" />
          {todo.budget != null ? formatCurrency(todo.budget) : 'Chưa đặt'}
        </span>
      </div>

      {isExpanded ? (
        <div className="space-y-4" onClick={stopPropagation}>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Danh sách nhà cung cấp</p>
            {todo.vendors.length > 0 ? (
              <ul className="space-y-2">
                {todo.vendors.map((vendor) => (
                  <li
                    className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-2.5 text-sm"
                    key={vendor.id}
                  >
                    <span className="min-w-0 truncate font-medium text-slate-900">
                      {vendor.link ? (
                        <a
                          className="text-sky-700 hover:underline"
                          href={toHref(vendor.link)}
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
            <div className="flex flex-wrap justify-end gap-2">
              {todo.status !== 'done' ? (
                <Button
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
              {todo.status !== 'cancelled' ? (
                <Button
                  disabled={isSubmitting}
                  onClick={(event) => {
                    event.stopPropagation();
                    onChangeStatus(todo, 'cancelled');
                  }}
                  variant="secondary"
                >
                  <XCircle className="size-4" />
                  Hủy
                </Button>
              ) : (
                <Button
                  disabled={isSubmitting}
                  onClick={(event) => {
                    event.stopPropagation();
                    onChangeStatus(todo, 'todo');
                  }}
                  variant="secondary"
                >
                  <Circle className="size-4" />
                  Khôi phục
                </Button>
              )}
              <Button
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
                className="text-rose-600 hover:bg-rose-50"
                disabled={isSubmitting}
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteTodo(todo);
                }}
                variant="ghost"
              >
                <Trash2 className="size-4" />
                Xóa
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
