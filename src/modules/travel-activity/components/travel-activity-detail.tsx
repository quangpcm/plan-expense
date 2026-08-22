'use client';

import { CalendarDays, Clock3, Coins, MapPinned, Pencil, Plus, Trash2, Users } from 'lucide-react';

import type { ExpenseDocument } from '@/modules/expense/types/expense';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { AttachmentGallery } from '@/modules/storage';
import { toMapHref } from '@/modules/travel-activity/utils/travel-activity-display';
import type { TravelActivityDocument } from '@/modules/travel-activity/types/travel-activity';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import { formatTime } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type TravelActivityDetailProps = {
  activity: TravelActivityDocument;
  expenses: ExpenseDocument[];
  members: PlanMemberDocument[];
  canManage: boolean;
  canCreateExpense: boolean;
  onEdit: (activity: TravelActivityDocument) => void;
  onDelete: (activity: TravelActivityDocument) => void;
  onOpenCreateExpense: (activity: TravelActivityDocument) => void;
};

export function TravelActivityDetail({
  activity,
  expenses,
  members,
  canManage,
  canCreateExpense,
  onEdit,
  onDelete,
  onOpenCreateExpense,
}: TravelActivityDetailProps) {
  const startsAt = timestampToDate(activity.startsAt);
  const endsAt = timestampToDate(activity.endsAt);
  const participantNames = members
    .filter((member) => activity.participantMemberIds.includes(member.id))
    .map((member) => member.nickname);
  const linkedExpenses = expenses.filter((expense) => expense.activityId === activity.id);
  const totalSpent = linkedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const durationLabel = getDurationLabel(startsAt, endsAt);
  const timeRangeLabel = getTimeRangeLabel(startsAt, endsAt);

  return (
    <Card className="gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            Activity Inspector
          </p>
          <h3 className="text-2xl font-semibold text-slate-950">{activity.title}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
            {startsAt ? (
              <p className="flex items-center gap-1.5">
                <CalendarDays className="size-4 shrink-0 text-slate-400" />
                <span>{formatFullDate(startsAt)}</span>
              </p>
            ) : null}
            {timeRangeLabel ? (
              <p className="flex items-center gap-1.5">
                <Clock3 className="size-4 shrink-0 text-slate-400" />
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
              className="flex size-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
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

      <div className="space-y-3 rounded-[24px] bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Địa điểm
        </p>
        {activity.locationName ? (
          <p className="flex items-start gap-2 text-sm leading-6 text-slate-700">
            <MapPinned className="mt-0.5 size-4 shrink-0 text-slate-400" />
            {activity.locationMapUrl ? (
              <a
                className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                href={toMapHref(activity.locationMapUrl)}
                rel="noreferrer"
                target="_blank"
              >
                {activity.locationName}
              </a>
            ) : (
              <span>{activity.locationName}</span>
            )}
          </p>
        ) : (
          <p className="text-sm leading-6 text-slate-500">Chưa có địa điểm cụ thể.</p>
        )}
      </div>

      <div className="space-y-3 rounded-[24px] bg-slate-50 p-4">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-slate-400" />
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Tham gia
          </p>
        </div>
        {participantNames.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {participantNames.map((name) => (
              <span
                className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
                key={name}
              >
                {name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-6 text-slate-500">Chưa có thành viên tham gia.</p>
        )}
      </div>

      <div className="space-y-4 rounded-[24px] border border-[var(--color-border)] bg-[color:color-mix(in_srgb,var(--color-primary)_4%,white)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Coins className="size-4 text-[var(--color-primary)]" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Chi phí thực tế
              </p>
            </div>
            <p className="text-2xl font-semibold text-slate-950">
              {formatCurrency(totalSpent)}
            </p>
            <p className="text-sm leading-6 text-slate-600">
              {linkedExpenses.length > 0
                ? `${linkedExpenses.length} khoản chi đã gắn với activity này.`
                : 'Chưa có khoản chi nào gắn với activity này.'}
            </p>
          </div>
          {canCreateExpense ? (
            <Button
              className="shrink-0"
              onClick={() => onOpenCreateExpense(activity)}
              variant="secondary"
            >
              <Plus className="size-4" />
              Thêm khoản chi
            </Button>
          ) : null}
        </div>
      </div>

      {activity.note ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Ghi chú
          </p>
          <p className="text-sm leading-7 text-slate-700">{activity.note}</p>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Đính kèm
        </p>
        <AttachmentGallery attachments={activity.attachments} emptyLabel="Chưa có ảnh đính kèm." />
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
