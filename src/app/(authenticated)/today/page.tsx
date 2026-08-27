'use client';

import { RefreshCw } from 'lucide-react';

import {
  ActiveContextBar,
  DailyBrief,
  PriorityNextCard,
  RecentlyCompletedRow,
  resolveNextPriorityItem,
  resolveTodayBrief,
  TodayItemCard,
  TodayProgressSummary,
  TodaySectionList,
  useTodaySummary,
} from '@/modules/today';
import type { TodaySummaryItem } from '@/modules/today/types/today-summary';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { ErrorState } from '@/shared/components/ui/error-state';
import { PageHeader } from '@/shared/components/ui/page-header';
import { Section } from '@/shared/components/ui/section';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { appRoutes } from '@/shared/constants';

const INITIAL_MOBILE_VISIBLE_COUNT = 3;

function formatTodayHeaderDate(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full' }).format(date);
}

function getTodayItemKey(item: TodaySummaryItem): string {
  return `${item.kind}:${item.planId}:${item.itemId}`;
}

function renderTodayItemCard(item: TodaySummaryItem) {
  return <TodayItemCard item={item} />;
}

export default function TodayPage() {
  const { summary, isLoading, error, refresh } = useTodaySummary();

  const attentionItems = summary?.attentionItems ?? [];
  const todayItems = summary?.todayItems ?? [];
  const upcomingItems = summary?.upcomingItems ?? [];
  const contexts = summary?.contexts ?? [];
  const completedTodayCount = summary?.completedTodayCount ?? 0;
  const totalTodayCount = summary?.totalTodayCount ?? 0;
  const recentlyCompletedItems = summary?.recentlyCompletedItems ?? [];
  const isFullyEmpty = summary !== null && attentionItems.length === 0 && todayItems.length === 0 && upcomingItems.length === 0;
  const todayPlanCount = new Set(todayItems.map((item) => item.planId)).size;
  const brief = resolveTodayBrief({
    attentionCount: attentionItems.length,
    todayCount: todayItems.length,
    upcomingCount: upcomingItems.length,
    planCount: todayPlanCount,
  });
  const now = new Date();
  const priorityItem = resolveNextPriorityItem({ attentionItems, todayItems, now });
  const hasProgress = totalTodayCount > 0;
  const hasCompletedItems = recentlyCompletedItems.length > 0;

  return (
    <>
      {contexts.length > 0 ? (
        <div className="sticky top-0 z-10 w-full">
          <div className="mx-auto w-full max-w-5xl animate-section-in px-4 sm:px-6" style={{ animationDelay: '20ms' }}>
            <div className="border-b border-[color:color-mix(in_srgb,var(--color-brand-primary)_18%,var(--color-border-default))] bg-[color:color-mix(in_srgb,var(--color-brand-subtle)_68%,white)]">
              <ActiveContextBar contexts={contexts} />
            </div>
          </div>
        </div>
      ) : null}

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-10 pt-4 sm:px-6 sm:pt-5 lg:pt-6">
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
            <div className="flex flex-col gap-3">
              <div className="w-full animate-section-in lg:max-w-[560px]" style={{ animationDelay: '40ms' }}>
                <DailyBrief
                  action={isFullyEmpty ? { href: appRoutes.plans, label: 'Xem kế hoạch' } : undefined}
                  headline={brief.headline}
                  supportingText={brief.supportingText}
                />
              </div>

              {priorityItem ? (
                <div className="w-full animate-section-in lg:max-w-[620px]" style={{ animationDelay: '80ms' }}>
                  <Section title="Ưu tiên tiếp theo">
                    <PriorityNextCard item={priorityItem} now={now} />
                  </Section>
                </div>
              ) : null}
            </div>

            {isFullyEmpty ? null : (
              <>
                {attentionItems.length > 0 ? (
                  <Section
                    className="animate-section-in"
                    style={{ animationDelay: '120ms' }}
                    title={`Cần chú ý (${attentionItems.length})`}
                  >
                    <TodaySectionList
                      getKey={getTodayItemKey}
                      initialMobileCount={INITIAL_MOBILE_VISIBLE_COUNT}
                      items={attentionItems}
                      renderItem={renderTodayItemCard}
                    />
                  </Section>
                ) : null}

                <Section className="animate-section-in" style={{ animationDelay: '120ms' }} title="Trong hôm nay">
                  <Card className="gap-4 rounded-[var(--radius-ds-xl)] border-[var(--color-border-strong)] bg-[var(--color-surface-default)] p-4 shadow-none sm:p-5">
                    {hasProgress ? (
                      <TodayProgressSummary completedTodayCount={completedTodayCount} totalTodayCount={totalTodayCount} />
                    ) : null}

                    {todayItems.length > 0 ? (
                      <TodaySectionList
                        getKey={getTodayItemKey}
                        initialMobileCount={INITIAL_MOBILE_VISIBLE_COUNT}
                        items={todayItems}
                        renderItem={renderTodayItemCard}
                      />
                    ) : hasProgress ? (
                      <EmptyState
                        className="rounded-[var(--radius-ds-lg)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-default)] px-4 py-8"
                        description="Mọi việc hôm nay đã xong. Bạn có thể nhìn sang những ngày tới."
                        title="Danh sách hôm nay đã trống"
                      />
                    ) : (
                      <EmptyState
                        className="rounded-[var(--radius-ds-lg)] border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-default)] px-4 py-8"
                        description="Không có công việc hoặc lịch trình cần xử lý hôm nay."
                        title="Hôm nay khá nhẹ nhàng"
                      />
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
                  </Card>
                </Section>
              </>
            )}

            {isFullyEmpty ? null : (
              <>
                {upcomingItems.length > 0 ? (
                  <Section
                    className="animate-section-in"
                    description="Sau hôm nay, đây là những việc và lịch trình đang đến gần."
                    style={{ animationDelay: '160ms' }}
                    title={`Những ngày tới (${upcomingItems.length})`}
                  >
                    <TodaySectionList
                      getKey={getTodayItemKey}
                      initialMobileCount={INITIAL_MOBILE_VISIBLE_COUNT}
                      items={upcomingItems}
                      renderItem={renderTodayItemCard}
                    />
                  </Section>
                ) : null}
              </>
            )}
          </div>
        )}
      </main>
    </>
  );
}
