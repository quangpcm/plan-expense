'use client';

import { CalendarDays, Clock3, Coins, ExternalLink, MapPinned, Pencil, Plus, Trash2 } from 'lucide-react';

import type { ExpenseDocument } from '@/modules/expense/types/expense';
import { AttachmentGallery } from '@/modules/storage';
import { getTravelActivityCategoryMeta, toMapHref } from '@/modules/travel-activity/utils/travel-activity-display';
import type { TravelActivityDocument } from '@/modules/travel-activity/types/travel-activity';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { cn } from '@/shared/utils/cn';
import { formatCurrency } from '@/shared/utils/currency';
import { formatTime } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type TravelActivityDetailProps = {
  activity: TravelActivityDocument;
  expenses: ExpenseDocument[];
  canManage: boolean;
  canCreateExpense: boolean;
  onEdit: (activity: TravelActivityDocument) => void;
  onDelete: (activity: TravelActivityDocument) => void;
  onOpenCreateExpense: (activity: TravelActivityDocument) => void;
  // 'card' (mặc định): panel viền/bóng/nền riêng — dùng khi đứng cạnh Timeline
  // trên desktop. 'plain': bỏ hẳn outer card vì đã nằm trong BottomSheet/Dialog
  // (chính sheet đó đã là container rồi, tránh lồng 2 lớp khung).
  variant?: 'card' | 'plain';
};

export function TravelActivityDetail({
  activity,
  expenses,
  canManage,
  canCreateExpense,
  onEdit,
  onDelete,
  onOpenCreateExpense,
  variant = 'card',
}: TravelActivityDetailProps) {
  const startsAt = timestampToDate(activity.startsAt);
  const endsAt = timestampToDate(activity.endsAt);
  const categoryMeta = getTravelActivityCategoryMeta(activity.category);
  const CategoryIcon = categoryMeta.icon;
  const linkedExpenses = expenses.filter((expense) => expense.activityId === activity.id);
  const totalSpent = linkedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const durationLabel = getDurationLabel(startsAt, endsAt);
  const timeRangeLabel = getTimeRangeLabel(startsAt, endsAt);

  return (
    <Card
      className={cn(
        'gap-6',
        variant === 'plain' ? 'rounded-none border-none bg-transparent p-0 shadow-none' : '',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              Chi tiết
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
              <CategoryIcon className="size-3.5 shrink-0" />
              {categoryMeta.label}
            </span>
          </div>
          <h3 className="text-2xl font-semibold text-[var(--color-text-primary)]">{activity.title}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--color-text-muted)]">
            {startsAt ? (
              <p className="flex items-center gap-1.5">
                <CalendarDays className="size-4 shrink-0 text-[var(--color-text-muted)]" />
                <span>{formatFullDate(startsAt)}</span>
              </p>
            ) : null}
            {timeRangeLabel ? (
              <p className="flex items-center gap-1.5">
                <Clock3 className="size-4 shrink-0 text-[var(--color-text-muted)]" />
                <span>
                  {timeRangeLabel}
                  {durationLabel ? ` · ${durationLabel}` : ''}
                </span>
              </p>
            ) : null}
          </div>
        </div>
        {canManage ? (
          <div className="flex shrink-0 gap-1">
            <button
              aria-label={`Sửa hoạt động ${activity.title}`}
              className="flex size-9 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)]"
              onClick={() => onEdit(activity)}
              type="button"
            >
              <Pencil className="size-4" />
            </button>
            <button
              aria-label={`Xóa hoạt động ${activity.title}`}
              className="flex size-9 items-center justify-center rounded-full text-rose-600 hover:bg-rose-50"
              onClick={() => onDelete(activity)}
              type="button"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 rounded-[24px] bg-[var(--color-surface-subtle)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
          Địa điểm
        </p>
        {activity.locationName ? (
          <p className="flex items-start gap-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            <MapPinned className="mt-0.5 size-4 shrink-0 text-[var(--color-text-muted)]" />
            {activity.locationMapUrl ? (
              <a
                className="inline-flex items-center gap-1 font-medium text-[var(--color-brand-primary)] underline decoration-dotted underline-offset-2 hover:decoration-solid"
                href={toMapHref(activity.locationMapUrl)}
                rel="noreferrer"
                target="_blank"
              >
                {activity.locationName}
                <ExternalLink className="size-3.5 shrink-0" />
              </a>
            ) : (
              <span>{activity.locationName}</span>
            )}
          </p>
        ) : (
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">Chưa có địa điểm cụ thể.</p>
        )}
      </div>

      <div className="space-y-4 rounded-[24px] border border-[var(--color-border-default)] bg-[var(--color-brand-subtle)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Coins className="size-4 text-[var(--color-brand-primary)]" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                Chi phí thực tế
              </p>
            </div>
            <p className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {formatCurrency(totalSpent)}
            </p>
            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
              {linkedExpenses.length > 0
                ? `${linkedExpenses.length} khoản chi đã gắn với activity này.`
                : 'Chưa có khoản chi.'}
            </p>
          </div>
          {canCreateExpense ? (
            <Button
              className="shrink-0"
              onClick={() => onOpenCreateExpense(activity)}
              variant="secondary"
            >
              <Plus className="size-4" />
              Thêm
            </Button>
          ) : null}
        </div>
      </div>

      {activity.note ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            Ghi chú
          </p>
          <p className="text-sm leading-7 text-[var(--color-text-secondary)]">{activity.note}</p>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
          Đính kèm
        </p>
        <AttachmentGallery attachments={activity.attachments} emptyLabel="Chưa có đính kèm." />
      </div>
    </Card>
  );
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
    .format(date)
    .replace(',', '')
    .replace(/^./, (char) => char.toUpperCase());
}

function getTimeRangeLabel(startsAt: Date | null, endsAt: Date | null) {
  if (!startsAt) {
    return null;
  }

  if (!endsAt) {
    return formatTime(startsAt);
  }

  return `${formatTime(startsAt)} - ${formatTime(endsAt)}`;
}

function getDurationLabel(startsAt: Date | null, endsAt: Date | null) {
  if (!startsAt || !endsAt) {
    return null;
  }

  const diffMs = endsAt.getTime() - startsAt.getTime();

  if (diffMs <= 0) {
    return null;
  }

  const totalMinutes = Math.round(diffMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours} giờ ${minutes} phút`;
  }

  if (hours > 0) {
    return `${hours} giờ`;
  }

  return `${minutes} phút`;
}
