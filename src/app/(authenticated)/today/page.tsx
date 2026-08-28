'use client';

import { AlertCircle, Clock3, RefreshCw, SunMedium } from 'lucide-react';

import {
  RecentlyCompletedRow,
  TodayItemCard,
  TodaySectionList,
  useTodaySummary,
} from '@/modules/today';
import type { TodaySummaryItem } from '@/modules/today/types/today-summary';
import { Button } from '@/shared/components/ui/button';
import { ErrorState } from '@/shared/components/ui/error-state';
import { PageHeader } from '@/shared/components/ui/page-header';
import { Skeleton } from '@/shared/components/ui/skeleton';

const INITIAL_MOBILE_VISIBLE_COUNT = 3;

type TodaySectionHeadingProps = {
  title: string;
  tone: 'attention' | 'today' | 'upcoming';
};

function TodaySectionHeading({ title, tone }: TodaySectionHeadingProps) {
  const icon =
    tone === 'attention' ? (
      <AlertCircle aria-hidden="true" className="size-4 text-[var(--color-status-warning)]" />
    ) : tone === 'today' ? (
      <SunMedium aria-hidden="true" className="size-4 text-[var(--color-brand-primary)]" />
    ) : (
      <Clock3 aria-hidden="true" className="size-4 text-[var(--color-text-muted)]" />
    );

  return (
    <div className="flex items-center gap-2">
      <div className="flex size-6 items-center justify-center rounded-full bg-[var(--color-surface-subtle)]">{icon}</div>
      <h2 className="text-section-title text-[var(--color-text-primary)]">{title}</h2>
    </div>
  );
}

function TodayEmptyRow() {
  return (
    <div className="rounded-[var(--radius-ds-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-default)] px-4 py-3">
      <div className="space-y-0.5">
        <p className="text-body-strong text-[var(--color-text-primary)]">Hôm nay khá nhẹ nhàng</p>
        <p className="text-body text-[var(--color-text-secondary)]">Không có công việc hoặc lịch trình nào được lên lịch hôm nay.</p>
      </div>
    </div>
  );
}

function TodayAttentionEmptyRow({ attentionCount }: { attentionCount: number }) {
  return (
    <div className="rounded-[var(--radius-ds-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-default)] px-4 py-3">
      <div className="space-y-0.5">
        <p className="text-body-strong text-[var(--color-text-primary)]">Không có việc nào đến hạn hôm nay</p>
        <p className="text-body text-[var(--color-text-secondary)]">
          Ưu tiên xử lý {attentionCount} việc cần chú ý ở phía trên.
        </p>
      </div>
    </div>
  );
}

function TodayAgendaEmptyState({ attentionCount }: { attentionCount: number }) {
  if (attentionCount > 0) {
    return <TodayAttentionEmptyRow attentionCount={attentionCount} />;
  }

  return <TodayEmptyRow />;
}

function formatTodayHeaderDate(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full' }).format(date);
}

function getTodayItemKey(item: TodaySummaryItem): string {
  return `${item.kind}:${item.planId}:${item.itemId}`;
}

export default function TodayPage() {
  const { summary, isLoading, error, refresh } = useTodaySummary();

  const attentionItems = summary?.attentionItems ?? [];
  const todayItems = summary?.todayItems ?? [];
  const upcomingItems = summary?.upcomingItems ?? [];
  const recentlyCompletedItems = summary?.recentlyCompletedItems ?? [];
  const isFullyEmpty = summary !== null && attentionItems.length === 0 && todayItems.length === 0 && upcomingItems.length === 0;
  const hasCompletedItems = recentlyCompletedItems.length > 0;

  return (
    <>
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-10 pt-4 sm:px-6 sm:pt-5 lg:pt-6">
        <PageHeader description={formatTodayHeaderDate(new Date())} title="Hôm nay" />

        {/* Error-with-existing-summary: a small non-blocking banner, summary content below stays visible (SWR). */}
        {error && summary ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-ds-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] px-4 py-3">
            <p className="text-body text-[var(--color-text-secondary)]">Không thể cập nhật dữ liệu mới nhất.</p>
            <Button onClick={refresh} size="sm" variant="ghost">
              <RefreshCw aria-hidden="true" className="size-3.5" />
              Thử lại
            </Button>
          </div>
        ) : null}

        {isLoading ? (
          <div aria-hidden="true" className="flex flex-col gap-2">
            <Skeleton className="h-16 rounded-[var(--radius-ds-xl)]" />
            <Skeleton className="h-16 rounded-[var(--radius-ds-xl)]" />
            <Skeleton className="h-16 rounded-[var(--radius-ds-xl)]" />
          </div>
        ) : !summary ? (
          <ErrorState
            action={
              <Button onClick={refresh} variant="primary">
                Thử lại
              </Button>
            }
            description="Vui lòng thử lại."
            title="Không tải được dữ liệu hôm nay."
          />
        ) : (
          <div className="flex flex-col gap-8">
            {attentionItems.length > 0 ? (
              <div className="animate-section-in space-y-4" style={{ animationDelay: '120ms' }}>
                <TodaySectionHeading title="Cần chú ý" tone="attention" />
                <TodaySectionList
                  getKey={getTodayItemKey}
                  initialMobileCount={INITIAL_MOBILE_VISIBLE_COUNT}
                  items={attentionItems}
                  renderItem={(item) => <TodayItemCard item={item} section="attention" />}
                />
              </div>
            ) : null}

            <div className="animate-section-in space-y-4" style={{ animationDelay: '120ms' }}>
              <TodaySectionHeading title="Hôm nay" tone="today" />
              <div className="space-y-3">
                {todayItems.length > 0 ? (
                  <TodaySectionList
                    getKey={getTodayItemKey}
                    initialMobileCount={INITIAL_MOBILE_VISIBLE_COUNT}
                    items={todayItems}
                    renderItem={(item) => <TodayItemCard item={item} section="today" />}
                  />
                ) : (
                  <TodayAgendaEmptyState attentionCount={attentionItems.length} />
                )}

                {hasCompletedItems ? (
                  <div className="space-y-2 border-t border-[var(--color-border-default)] pt-4">
                    <p className="text-body-strong text-[var(--color-text-primary)]">Vừa hoàn thành</p>
                    <div className="flex flex-col gap-1">
                      {recentlyCompletedItems.map((item) => (
                        <RecentlyCompletedRow item={item} key={`${item.planId}:${item.todoId}`} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {isFullyEmpty ? null : (
              <>
                {upcomingItems.length > 0 ? (
                  <div className="animate-section-in space-y-4" style={{ animationDelay: '160ms' }}>
                    <TodaySectionHeading title="Sắp tới" tone="upcoming" />
                    <TodaySectionList
                      className="-my-1"
                      getKey={getTodayItemKey}
                      initialMobileCount={INITIAL_MOBILE_VISIBLE_COUNT}
                      items={upcomingItems}
                      renderItem={(item) => <TodayItemCard item={item} section="upcoming" />}
                    />
                  </div>
                ) : null}
              </>
            )}
          </div>
        )}
      </main>
    </>
  );
}
