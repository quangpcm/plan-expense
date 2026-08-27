'use client';

import { RefreshCw } from 'lucide-react';

import { TodayItemRow, useTodaySummary } from '@/modules/today';
import { Button } from '@/shared/components/ui/button';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { EntityList } from '@/shared/components/ui/entity-list';
import { ErrorState } from '@/shared/components/ui/error-state';
import { PageHeader } from '@/shared/components/ui/page-header';
import { Section } from '@/shared/components/ui/section';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { appRoutes } from '@/shared/constants';

function formatTodayHeaderDate(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full' }).format(date);
}

export default function TodayPage() {
  const { summary, isLoading, error, refresh } = useTodaySummary();

  const attentionItems = summary?.attentionItems ?? [];
  const todayItems = summary?.todayItems ?? [];
  const upcomingItems = summary?.upcomingItems ?? [];
  const isFullyEmpty = summary !== null && attentionItems.length === 0 && todayItems.length === 0 && upcomingItems.length === 0;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-10 sm:px-6">
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
        <div aria-hidden="true" className="flex flex-col gap-4">
          <Skeleton className="h-24 rounded-[var(--radius-ds-xl)]" />
          <Skeleton className="h-24 rounded-[var(--radius-ds-xl)]" />
          <Skeleton className="h-24 rounded-[var(--radius-ds-xl)]" />
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
      ) : isFullyEmpty ? (
        <EmptyState
          action={
            <Button href={appRoutes.plans} variant="primary">
              Xem các kế hoạch
            </Button>
          }
          title="Bạn không có gì cần chú ý lúc này."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {attentionItems.length > 0 ? (
            <Section title="Cần chú ý">
              <EntityList>
                {attentionItems.map((item) => (
                  <TodayItemRow item={item} key={`${item.kind}:${item.planId}:${item.itemId}`} />
                ))}
              </EntityList>
            </Section>
          ) : null}

          <Section title="Hôm nay">
            {todayItems.length > 0 ? (
              <EntityList>
                {todayItems.map((item) => (
                  <TodayItemRow item={item} key={`${item.kind}:${item.planId}:${item.itemId}`} />
                ))}
              </EntityList>
            ) : (
              <EmptyState
                description="Không có công việc hoặc lịch trình cần xử lý hôm nay."
                title="Hôm nay khá nhẹ nhàng"
              />
            )}
          </Section>

          {upcomingItems.length > 0 ? (
            <Section title="Sắp tới">
              <EntityList>
                {upcomingItems.map((item) => (
                  <TodayItemRow item={item} key={`${item.kind}:${item.planId}:${item.itemId}`} />
                ))}
              </EntityList>
            </Section>
          ) : null}
        </div>
      )}
    </main>
  );
}
