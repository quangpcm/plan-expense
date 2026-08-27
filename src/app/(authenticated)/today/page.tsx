'use client';

import { RefreshCw } from 'lucide-react';

import {
  DailyBrief,
  PriorityNextCard,
  RecentlyCompletedRow,
  resolveNextPriorityItem,
  resolveTodayBrief,
  TodayContextCard,
  TodayItemCard,
  TodayProgressCard,
  TodaySectionList,
  useTodaySummary,
} from '@/modules/today';
import type { TodaySummaryItem } from '@/modules/today/types/today-summary';
import { Button } from '@/shared/components/ui/button';
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
          {/* Composition-only width cap (not fit-content, so it never resizes with day-to-day copy
              length): Daily Brief ~55-60%, Priority ~60-70% of the ~900px desktop reading column,
              left-aligned. Below `lg:` (mobile+tablet, matching Today's existing breakpoint
              convention), both stay full width. No change to either component's own API. */}
          <div className="w-full lg:max-w-[560px]">
            <DailyBrief
              action={isFullyEmpty ? { href: appRoutes.plans, label: 'Xem kế hoạch' } : undefined}
              headline={brief.headline}
              supportingText={brief.supportingText}
            />
          </div>

          {priorityItem ? (
            <div className="w-full lg:max-w-[620px]">
              <Section title="Ưu tiên tiếp theo">
                <PriorityNextCard item={priorityItem} now={now} />
              </Section>
            </div>
          ) : null}

          {isFullyEmpty ? null : (
            <>
              {attentionItems.length > 0 ? (
                <Section title={`Cần chú ý (${attentionItems.length})`}>
                  <TodaySectionList
                    getKey={getTodayItemKey}
                    initialMobileCount={INITIAL_MOBILE_VISIBLE_COUNT}
                    items={attentionItems}
                    renderItem={renderTodayItemCard}
                  />
                </Section>
              ) : null}

              <Section title={`Hôm nay (${todayItems.length})`}>
                {todayItems.length > 0 ? (
                  <TodaySectionList
                    getKey={getTodayItemKey}
                    initialMobileCount={INITIAL_MOBILE_VISIBLE_COUNT}
                    items={todayItems}
                    renderItem={renderTodayItemCard}
                  />
                ) : (
                  <EmptyState
                    description="Không có công việc hoặc lịch trình cần xử lý hôm nay."
                    title="Hôm nay khá nhẹ nhàng"
                  />
                )}
              </Section>
            </>
          )}

          {/* Independent of isFullyEmpty by design (same reasoning as Active Context below): a day
              can have zero remaining active todos/activities (isFullyEmpty) while still having
              completed something today (e.g. 3 todos due today, all 3 done) — Progress should
              still show "3/3, Xong hết rồi" instead of disappearing just because nothing is left
              to do. Self-gated purely on totalTodayCount > 0.
              NOTE for Final Polish (Phase 4.1 explicitly deferred this, not this round): evaluate
              placing Priority + Progress side by side on desktop as a 2-column composition to use
              horizontal space better — both are already compact (620px/560px caps) and sit
              directly adjacent in the current single-column layout. */}
          {totalTodayCount > 0 ? (
            <div className="w-full lg:max-w-[560px]">
              <Section title="Tiến độ hôm nay">
                <TodayProgressCard completedTodayCount={completedTodayCount} totalTodayCount={totalTodayCount} />
              </Section>
            </div>
          ) : null}

          {/* Independent of isFullyEmpty by design (Phase 3.1): a trip can be genuinely ongoing on
              a day with zero todos/activities due (a rest day), so Active Context must still show
              on an otherwise-empty Today instead of disappearing along with the Todo/Activity
              sections above. Each card stays width-agnostic; this wrapper is what keeps it compact
              (not the full ~900px reading column) and lets 1-2 cards sit side by side on desktop
              when there's room, matching Daily Brief/Priority's own compact-column treatment. */}
          {contexts.length > 0 ? (
            <Section title="Đang diễn ra">
              <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
                {contexts.map((context) => (
                  <div className="w-full lg:max-w-[380px]" key={`${context.kind}:${context.planId}`}>
                    <TodayContextCard context={context} />
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {isFullyEmpty ? null : (
            <>
              {upcomingItems.length > 0 ? (
                <Section title={`Sắp tới (${upcomingItems.length})`}>
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

          {/* Independent of isFullyEmpty — same "you may have finished everything" reasoning as
              Progress above. Compact borderless list (no per-item Card chrome), max 3 items
              already enforced by buildRecentlyCompletedItems. */}
          {recentlyCompletedItems.length > 0 ? (
            <div className="w-full lg:max-w-[560px]">
              <Section title="Gần đây bạn đã hoàn thành">
                <div className="flex flex-col gap-1">
                  {recentlyCompletedItems.map((item) => (
                    <RecentlyCompletedRow item={item} key={`${item.planId}:${item.todoId}`} />
                  ))}
                </div>
              </Section>
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}
