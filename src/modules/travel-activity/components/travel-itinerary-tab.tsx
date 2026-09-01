'use client';

import { CalendarRange, Clock3, Plus, Route } from 'lucide-react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import type { ExpenseDocument } from '@/modules/expense/types/expense';
import { ResponsiveModal } from '@/shared/components/ui/responsive-modal';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  TravelActivityDetail,
  TravelActivityList,
} from '@/modules/travel-activity';
import type { TravelActivityDocument } from '@/modules/travel-activity/types/travel-activity';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { formatDueCountdown } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type TravelItineraryTabProps = {
  activities: TravelActivityDocument[];
  canCreateExpense: boolean;
  canManage: boolean;
  detailActivity: TravelActivityDocument | null;
  errorMessage: string | null;
  expenses: ExpenseDocument[];
  isLoading: boolean;
  onCloseDetail: () => void;
  onCreate: () => void;
  onDelete: (activity: TravelActivityDocument) => void;
  onEdit: (activity: TravelActivityDocument) => void;
  onOpenCreateExpense: (activity: TravelActivityDocument) => void;
  onSelect: (activity: TravelActivityDocument) => void;
};

export function TravelItineraryTab({
  activities,
  canCreateExpense,
  canManage,
  detailActivity,
  errorMessage,
  expenses,
  isLoading,
  onCloseDetail,
  onCreate,
  onDelete,
  onEdit,
  onOpenCreateExpense,
  onSelect,
}: TravelItineraryTabProps) {
  const summary = buildItinerarySummary(activities);
  const isDesktopLayout = useMediaQuery('(min-width: 1280px)');

  return (
    <div className="space-y-5">
      <SectionHeading
        action={
          canManage ? (
            <Button onClick={onCreate}>
              <Plus className="size-4" />
              Hoạt động
            </Button>
          ) : null
        }
        eyebrow="Lịch trình"
        title="Lịch trình chuyến đi"
        description="Theo dõi hoạt động, điểm dừng và việc sắp diễn ra trong suốt chuyến đi."
      />
      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-72 rounded-[28px]" />
          ) : (
            <TravelActivityList
              activities={activities}
              onSelect={onSelect}
              selectedActivityId={detailActivity?.id ?? null}
            />
          )}
        </div>
        <div className="hidden space-y-4 xl:block">
          {isLoading ? (
            <Skeleton className="h-72 rounded-[28px]" />
          ) : detailActivity ? (
            <TravelActivityDetail
              activity={detailActivity}
              canCreateExpense={canCreateExpense}
              canManage={canManage}
              expenses={expenses}
              onDelete={onDelete}
              onEdit={onEdit}
              onOpenCreateExpense={onOpenCreateExpense}
            />
          ) : (
            <TravelItinerarySummaryCard summary={summary} />
          )}
        </div>
      </div>

      {/* Mobile/tablet (< xl): detail không hiện inline nữa (đã ẩn ở cột trên) —
          chọn 1 activity mở qua ResponsiveModal (Dialog/Drawer có animation, cùng
          component với form sửa activity) thay vì render tĩnh. Chỉ mở khi
          `!isDesktopLayout` để không trùng với cột inline trên desktop. */}
      <ResponsiveModal
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto"
        onOpenChange={(open) => {
          if (!open) {
            onCloseDetail();
          }
        }}
        open={!isDesktopLayout && Boolean(detailActivity)}
        title="Chi tiết hoạt động"
      >
        {detailActivity ? (
          <TravelActivityDetail
            activity={detailActivity}
            canCreateExpense={canCreateExpense}
            canManage={canManage}
            expenses={expenses}
            onDelete={onDelete}
            onEdit={onEdit}
            onOpenCreateExpense={onOpenCreateExpense}
            variant="plain"
          />
        ) : null}
      </ResponsiveModal>
    </div>
  );
}

type TravelItinerarySummary = {
  dayCount: number;
  totalActivities: number;
  totalLocations: number;
  upcomingActivity: TravelActivityDocument | null;
  rangeLabel: string | null;
};

function TravelItinerarySummaryCard({
  summary,
}: {
  summary: TravelItinerarySummary;
}) {
  return (
    <Card className="gap-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
          Lịch trình chuyến đi
        </p>
        <h3 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          {summary.totalActivities > 0 ? 'Chọn một activity để xem chi tiết' : 'Chưa có activity nào'}
        </h3>
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
          Timeline bên trái đã đủ thông tin để scan nhanh, còn khung này sẽ giữ vai trò summary hoặc inspector khi bạn chọn một activity.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
        <SummaryMetric
          icon={CalendarRange}
          label="Thời gian"
          value={summary.rangeLabel ?? 'Chưa có lịch'}
          secondary={`${summary.dayCount} ngày có hoạt động`}
        />
        <SummaryMetric
          icon={Route}
          label="Hoạt động"
          value={`${summary.totalActivities}`}
          secondary={`${summary.totalLocations} địa điểm`}
        />
        <SummaryMetric
          icon={Clock3}
          label="Tiếp theo"
          value={summary.upcomingActivity?.title ?? 'Chưa có lịch sắp tới'}
          secondary={
            summary.upcomingActivity
              ? buildUpcomingLabel(summary.upcomingActivity)
              : 'Thêm activity để bắt đầu lên itinerary'
          }
        />
      </div>
    </Card>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
  secondary,
}: {
  icon: typeof CalendarRange;
  label: string;
  value: string;
  secondary: string;
}) {
  return (
    <div className="rounded-[24px] bg-[var(--color-surface-subtle)] p-4">
      <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
        <Icon className="size-4" />
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">{label}</p>
      </div>
      <p className="mt-3 text-lg font-semibold text-[var(--color-text-primary)]">{value}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{secondary}</p>
    </div>
  );
}

function buildItinerarySummary(
  activities: TravelActivityDocument[],
): TravelItinerarySummary {
  if (activities.length === 0) {
    return {
      dayCount: 0,
      totalActivities: 0,
      totalLocations: 0,
      upcomingActivity: null,
      rangeLabel: null,
    };
  }

  const sorted = [...activities].sort(
    (left, right) => left.startsAt.toMillis() - right.startsAt.toMillis(),
  );
  const firstDate = timestampToDate(sorted[0]?.startsAt);
  const lastDate = timestampToDate(sorted[sorted.length - 1]?.startsAt);
  const dayCount = new Set(
    sorted
      .map((activity) => timestampToDate(activity.startsAt))
      .filter(Boolean)
      .map((date) => formatDayKey(date as Date)),
  ).size;
  const totalLocations = new Set(
    sorted.map((activity) => activity.locationName).filter(Boolean),
  ).size;
  const now = Date.now();
  const upcomingActivity =
    sorted.find((activity) => activity.startsAt.toMillis() >= now) ?? null;

  return {
    dayCount,
    totalActivities: sorted.length,
    totalLocations,
    upcomingActivity,
    rangeLabel:
      firstDate && lastDate
        ? `${formatShortDate(firstDate)} - ${formatShortDate(lastDate)}`
        : null,
  };
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

function formatDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function buildUpcomingLabel(activity: TravelActivityDocument) {
  const startsAt = timestampToDate(activity.startsAt);

  if (!startsAt) {
    return 'Đã lên lịch';
  }

  const countdown = formatDueCountdown(startsAt);
  const timeLabel = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(startsAt);

  return `${timeLabel} · ${countdown}`;
}
