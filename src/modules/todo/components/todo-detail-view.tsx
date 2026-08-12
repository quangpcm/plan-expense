import { CalendarDays, CheckCircle2, Clock3, PencilLine, Plus, Trash2, Wallet, X } from 'lucide-react';

import type { TodoDocument } from '@/modules/todo/types/todo';
import { priorityLabel, statusLabel, toVendorHref } from '@/modules/todo/utils/todo-display';
import { getSelectedTodoVendor, getTodoBudgetAmount } from '@/modules/todo/utils/todo-budget';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { AttachmentGallery } from '@/modules/storage';
import { Avatar } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { DropdownSelect, type DropdownOption } from '@/shared/components/ui/dropdown-select';
import { cn } from '@/shared/utils/cn';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type TodoDetailViewProps = {
  todo: TodoDocument;
  assignee: PlanMemberDocument | null;
  canManagePlan: boolean;
  isSubmitting: boolean;
  milestoneOptions: DropdownOption[];
  onEdit: (todo: TodoDocument) => void;
  onAddVendor: (todo: TodoDocument) => void;
  onSelectVendor: (todo: TodoDocument, vendorId: string) => void;
  onMoveToMilestone: (todo: TodoDocument, milestoneId: string) => void;
  onChangeStatus: (todo: TodoDocument, status: TodoDocument['status']) => void;
  onDeleteTodo: (todo: TodoDocument) => void;
  onClose: () => void;
};

export function TodoDetailView({
  todo,
  assignee,
  canManagePlan,
  isSubmitting,
  milestoneOptions,
  onEdit,
  onAddVendor,
  onSelectVendor,
  onMoveToMilestone,
  onChangeStatus,
  onDeleteTodo,
  onClose,
}: TodoDetailViewProps) {
  const dueDate = timestampToDate(todo.dueDate);
  const selectedVendor = getSelectedTodoVendor(todo);
  const displayedBudget = getTodoBudgetAmount(todo);

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
            {displayedBudget != null ? formatCurrency(displayedBudget) : 'Chưa đặt'}
          </p>
        </div>
      </div>

      {selectedVendor ? (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-[#d7e5ff] bg-[#eff5ff] px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.16em] text-[#6a84b6]">Nhà cung cấp đã chọn</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span className="truncate font-semibold text-[#1d3f7a]">{selectedVendor.name}</span>
              <span className="text-[#6b84b1]">·</span>
              <span className="font-medium text-[#36568f]">{formatCurrency(selectedVendor.price)}</span>
            </div>
          </div>
          {canManagePlan ? (
            <button
              aria-label="Bỏ chọn nhà cung cấp"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[#5f79a8] transition hover:bg-white/70 hover:text-[#1d4ed8]"
              disabled={isSubmitting}
              onClick={() => onSelectVendor(todo, selectedVendor.id)}
              type="button"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Danh sách nhà cung cấp</p>
        {todo.vendors.length > 0 ? (
          <ul className="space-y-2">
            {todo.vendors.map((vendor) => (
              <li
                className={cn(
                  'space-y-1 rounded-2xl border px-4 py-2.5 text-sm transition',
                  vendor.id === todo.selectedTodoVendorId
                    ? 'border-[#cfe0ff] bg-[#eef4ff]'
                    : 'border-transparent bg-slate-50 hover:border-[#dbe5f7]',
                )}
                key={vendor.id}
                onClick={() => onSelectVendor(todo, vendor.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectVendor(todo, vendor.id);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block truncate font-medium text-slate-900">
                      {vendor.link ? (
                        <a
                          className="text-sky-700 hover:underline"
                          href={toVendorHref(vendor.link)}
                          onClick={(event) => event.stopPropagation()}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {vendor.name}
                        </a>
                      ) : (
                        vendor.name
                      )}
                    </span>
                  </div>
                  <span className={cn('shrink-0 font-medium', vendor.id === todo.selectedTodoVendorId ? 'text-[#1d4ed8]' : 'text-slate-600')}>
                    {formatCurrency(vendor.price)}
                  </span>
                </div>
                {vendor.description ? (
                  <p className="line-clamp-2 text-xs leading-5 text-slate-500">{vendor.description}</p>
                ) : null}
                {vendor.attachments.length > 0 ? (
                  <div onClick={(event) => event.stopPropagation()} role="presentation">
                    <AttachmentGallery attachments={vendor.attachments} size="sm" />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Chưa có nhà cung cấp nào.</p>
        )}
        {canManagePlan ? (
          <Button className="w-full justify-center" onClick={() => onAddVendor(todo)} variant="ghost">
            <Plus className="size-4" />
            Thêm
          </Button>
        ) : null}
      </div>

      {canManagePlan ? (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Chuyển sang mốc khác</p>
          <DropdownSelect
            disabled={isSubmitting}
            onValueChange={(value) => onMoveToMilestone(todo, value)}
            options={milestoneOptions}
            placeholder="Chọn milestone đích"
            value={todo.milestoneId}
          />
        </div>
      ) : null}

      {todo.attachments.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Hình ảnh</p>
          <AttachmentGallery attachments={todo.attachments} />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button onClick={onClose} variant="ghost">
          Đóng
        </Button>
        {canManagePlan ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {todo.status !== 'done' ? (
              <Button
                className="px-4"
                disabled={isSubmitting}
                onClick={() => onChangeStatus(todo, 'done')}
                variant="secondary"
              >
                <CheckCircle2 className="size-4" />
                Hoàn thành
              </Button>
            ) : (
              <Button
                className="px-4"
                disabled={isSubmitting}
                onClick={() => onChangeStatus(todo, 'in_progress')}
                variant="secondary"
              >
                <Clock3 className="size-4" />
                Đang làm lại
              </Button>
            )}
            <Button className="px-4" disabled={isSubmitting} onClick={() => onEdit(todo)}>
              <PencilLine className="size-4" />
              Sửa
            </Button>
            <Button
              aria-label="Xóa công việc"
              className="size-9 min-h-9 shrink-0 justify-center px-0 text-rose-600 hover:bg-rose-50"
              disabled={isSubmitting}
              onClick={() => onDeleteTodo(todo)}
              variant="ghost"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
