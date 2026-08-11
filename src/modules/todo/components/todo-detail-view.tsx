import { CalendarDays, PencilLine, Wallet } from 'lucide-react';

import type { TodoDocument } from '@/modules/todo/types/todo';
import { priorityLabel, statusLabel, toVendorHref } from '@/modules/todo/utils/todo-display';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { Avatar } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type TodoDetailViewProps = {
  todo: TodoDocument;
  assignee: PlanMemberDocument | null;
  canManagePlan: boolean;
  onEdit: (todo: TodoDocument) => void;
  onClose: () => void;
};

export function TodoDetailView({ todo, assignee, canManagePlan, onEdit, onClose }: TodoDetailViewProps) {
  const dueDate = timestampToDate(todo.dueDate);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Avatar initials={assignee?.nickname.slice(0, 2).toUpperCase() ?? 'PE'} src={assignee?.avatarUrl ?? null} />
        <div className="min-w-0 flex-1 space-y-1.5">
          <h4 className="text-base font-semibold text-slate-950">{todo.title}</h4>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={todo.status === 'done' ? 'success' : todo.status === 'cancelled' ? 'neutral' : 'info'}>
              {statusLabel[todo.status]}
            </Badge>
            <Badge variant="neutral">{priorityLabel[todo.priority]}</Badge>
          </div>
        </div>
      </div>

      <p className="text-sm leading-6 text-slate-600">{todo.description || 'Chưa có mô tả.'}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Thời hạn</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-900">
            <CalendarDays className="size-4 text-slate-400" />
            {dueDate ? formatDate(dueDate) : 'Chưa đặt'}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Ngân sách</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-900">
            <Wallet className="size-4 text-slate-400" />
            {todo.budget != null ? formatCurrency(todo.budget) : 'Chưa đặt'}
          </p>
        </div>
      </div>

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
                      href={toVendorHref(vendor.link)}
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
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button onClick={onClose} variant="ghost">
          Đóng
        </Button>
        {canManagePlan ? (
          <Button onClick={() => onEdit(todo)}>
            <PencilLine className="size-4" />
            Sửa
          </Button>
        ) : null}
      </div>
    </div>
  );
}
