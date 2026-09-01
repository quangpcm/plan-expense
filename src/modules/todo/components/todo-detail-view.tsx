import { useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, PencilLine, Phone, Plus, Trash2, Wallet, X } from 'lucide-react';

import type { TodoDocument } from '@/modules/todo/types/todo';
import { priorityLabel, statusLabel, toTelHref, toVendorHref } from '@/modules/todo/utils/todo-display';
import { getSelectedTodoVendor, getTodoBudgetAmount } from '@/modules/todo/utils/todo-budget';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { AttachmentGallery, resolveAttachmentUrl } from '@/modules/storage';
import { ThumbnailCompact } from '@/shared/components/media/thumbnail-compact';
import { Avatar } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { DropdownSelect, type DropdownOption } from '@/shared/components/ui/dropdown-select';
import { PhotoPreview, type PhotoPreviewItem } from '@/shared/components/ui/photo-preview';
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
  onEditVendor: (todo: TodoDocument, vendorId: string) => void;
  onDeleteVendor: (todo: TodoDocument, vendorId: string) => void;
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
  onEditVendor,
  onDeleteVendor,
  onSelectVendor,
  onMoveToMilestone,
  onChangeStatus,
  onDeleteTodo,
  onClose,
}: TodoDetailViewProps) {
  const dueDate = timestampToDate(todo.dueDate);
  const selectedVendor = getSelectedTodoVendor(todo);
  const displayedBudget = getTodoBudgetAmount(todo);
  const [copiedVendorId, setCopiedVendorId] = useState<string | null>(null);
  const [vendorPhotoPreview, setVendorPhotoPreview] = useState<{ items: PhotoPreviewItem[]; index: number } | null>(
    null,
  );

  async function handleCopyVendorPhone(vendorId: string, phoneNumber: string) {
    await navigator.clipboard.writeText(phoneNumber);
    setCopiedVendorId(vendorId);
    setTimeout(() => setCopiedVendorId((current) => (current === vendorId ? null : current)), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Avatar initials={assignee?.nickname.slice(0, 2).toUpperCase() ?? 'PE'} src={assignee?.avatarUrl ?? null} />
        <div className="min-w-0 flex-1 space-y-1.5">
          <h4 className="text-base font-semibold text-[var(--color-text-primary)]">{todo.title}</h4>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={todo.status === 'done' ? 'success' : todo.status === 'cancelled' ? 'neutral' : 'info'}>
              {statusLabel[todo.status]}
            </Badge>
            <Badge variant="neutral">{priorityLabel[todo.priority]}</Badge>
          </div>
        </div>
      </div>

      <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{todo.description || 'Chưa có mô tả.'}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Thời hạn</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-primary)]">
            <CalendarDays className="size-4 text-[var(--color-text-muted)]" />
            {dueDate ? formatDate(dueDate) : 'Chưa đặt'}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Ngân sách</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-primary)]">
            <Wallet className="size-4 text-[var(--color-text-muted)]" />
            {displayedBudget != null ? formatCurrency(displayedBudget) : 'Chưa đặt'}
          </p>
        </div>
      </div>

      {selectedVendor ? (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--color-info)]/25 bg-[var(--color-info-soft)] px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Nhà cung cấp đã chọn</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span className="truncate font-semibold text-[var(--color-info)]">{selectedVendor.name}</span>
              <span className="text-[var(--color-text-muted)]">·</span>
              <span className="font-medium text-[var(--color-info)]">{formatCurrency(selectedVendor.price)}</span>
            </div>
          </div>
          {canManagePlan ? (
            <button
              aria-label="Bỏ chọn nhà cung cấp"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] transition hover:bg-[color:color-mix(in_srgb,var(--color-surface-default)_70%,transparent)] hover:text-[var(--color-info)]"
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
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Danh sách nhà cung cấp</p>
        {todo.vendors.length > 0 ? (
          <ul className="space-y-2">
            {todo.vendors.map((vendor) => {
              const phoneNumber = vendor.phoneNumber;
              const vendorImages: PhotoPreviewItem[] = vendor.attachments
                .filter((attachment) => attachment.mimeType.startsWith('image/'))
                .map((attachment) => ({ id: attachment.id, url: resolveAttachmentUrl(attachment), alt: attachment.fileName }));

              return (
              <li
                className={cn(
                  'flex items-start gap-2.5 rounded-2xl border px-3 py-2 text-sm transition',
                  vendor.id === todo.selectedTodoVendorId
                    ? 'border-[var(--color-info)]/30 bg-[var(--color-info-soft)]'
                    : 'border-transparent bg-[var(--color-surface-subtle)] hover:border-[var(--color-info)]/20',
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
                {vendorImages.length > 0 ? (
                  <div onClick={(event) => event.stopPropagation()} role="presentation">
                    <ThumbnailCompact
                      ariaLabelSuffix={`của ${vendor.name}`}
                      onPhotoClick={(_photo, index) => setVendorPhotoPreview({ items: vendorImages, index })}
                      photos={vendorImages}
                    />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="block truncate font-medium text-[var(--color-text-primary)]">
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
                    <div className="flex shrink-0 items-center gap-0.5">
                      {vendor.price > 0 ? (
                        <span
                          className={cn(
                            'mr-0.5 font-medium',
                            vendor.id === todo.selectedTodoVendorId ? 'text-[var(--color-info)]' : 'text-[var(--color-text-secondary)]',
                          )}
                        >
                          {formatCurrency(vendor.price)}
                        </span>
                      ) : null}
                      {canManagePlan ? (
                        <button
                          aria-label={`Sửa nhà cung cấp ${vendor.name}`}
                          className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-default)] hover:text-[var(--color-text-secondary)]"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditVendor(todo, vendor.id);
                          }}
                          type="button"
                        >
                          <PencilLine className="size-3" />
                        </button>
                      ) : null}
                      {canManagePlan ? (
                        <button
                          aria-label={`Xoá nhà cung cấp ${vendor.name}`}
                          className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] transition hover:bg-rose-50 hover:text-rose-600"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteVendor(todo, vendor.id);
                          }}
                          type="button"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {phoneNumber ? (
                    <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]" onClick={(event) => event.stopPropagation()}>
                      <button
                        aria-label={
                          copiedVendorId === vendor.id ? 'Đã sao chép số điện thoại' : `Sao chép số điện thoại ${phoneNumber}`
                        }
                        className="truncate text-left hover:text-[var(--color-text-primary)]"
                        onClick={() => handleCopyVendorPhone(vendor.id, phoneNumber)}
                        type="button"
                      >
                        {copiedVendorId === vendor.id ? 'Đã sao chép' : phoneNumber}
                      </button>
                      <a
                        aria-label={`Gọi ${phoneNumber}`}
                        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[var(--color-info)] hover:bg-[var(--color-info-soft)]"
                        href={toTelHref(phoneNumber)}
                      >
                        <Phone className="size-3.5" />
                      </a>
                    </div>
                  ) : null}
                  {vendor.description ? (
                    <p className="line-clamp-2 text-xs leading-5 text-[var(--color-text-muted)]">{vendor.description}</p>
                  ) : null}
                </div>
              </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">Chưa có nhà cung cấp nào.</p>
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
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Chuyển sang mốc khác</p>
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
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Hình ảnh</p>
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

      {vendorPhotoPreview ? (
        <PhotoPreview
          initialIndex={vendorPhotoPreview.index}
          items={vendorPhotoPreview.items}
          onClose={() => setVendorPhotoPreview(null)}
        />
      ) : null}
    </div>
  );
}
