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
  const hasPriority = priorityItem !== null;
  const hasProgress = totalTodayCount > 0;

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
              length): Daily Brief ~55-60% of the ~900px desktop reading column, left-aligned. Below
              `lg:` (mobile+tablet, matching Today's existing breakpoint convention), full width.
              Section-entrance motion (Phase 5 §12, globals.css `animate-section-in`): staggered by
              group, not by individual card — reduced motion is handled globally, not per-component
              (globals.css already collapses all animation/transition durations under
              `prefers-reduced-motion: reduce`). */}
          <div className="w-full animate-section-in lg:max-w-[560px]" style={{ animationDelay: '40ms' }}>
            <DailyBrief
              action={isFullyEmpty ? { href: appRoutes.plans, label: 'Xem kế hoạch' } : undefined}
              headline={brief.headline}
              supportingText={brief.supportingText}
            />
          </div>

          {/* Priority + Progress "Focus group" (Phase 5 §4). Desktop: side by side in a
              1.4fr/0.9fr grid when both exist, collapsing to a single compact column when only one
              does (no dead grid column — §17). Mobile/tablet: linear stack, Priority here,
              Progress instead rendered in its own standalone slot further down (after "Hôm nay"),
              matching the mobile order the spec calls for (§10: Brief, Priority, Cần chú ý, Hôm
              nay, Progress, ...).
              Deliberately two small DOM instances of TodayProgressCard (here, desktop-only via
              `hidden lg:block`; and again below Today, mobile-only via `lg:hidden`) rather than one
              instance repositioned with CSS `order`/`grid-area`: this component's desktop position
              (beside Priority, near the top) and its mobile position (after Today) are genuinely
              different sequences, not just a different arrangement of the same sequence — reflowing
              a single instance with `order` would make visual order diverge from DOM/reading order
              between breakpoints, breaking screen-reader/keyboard sequence. Same reasoning as this
              app's separate mobile-bottom-nav vs desktop-top-nav components. Each instance is cheap
              and presentational (props only, no data fetching); only one is ever visible at a time
              per breakpoint (`display:none` removes the hidden one from the accessibility tree and
              tab order). */}
          {hasPriority || hasProgress ? (
            <div
              className={
                hasPriority && hasProgress
                  ? 'w-full animate-section-in lg:max-w-[900px]'
                  : hasPriority
                    ? 'w-full animate-section-in lg:max-w-[620px]'
                    : 'hidden animate-section-in lg:block lg:max-w-[560px]'
              }
              style={{ animationDelay: '80ms' }}
            >
              <div
                className={
                  hasPriority && hasProgress
                    ? 'flex flex-col gap-8 lg:grid lg:grid-cols-[1.4fr_0.9fr] lg:items-start lg:gap-4'
                    : 'flex flex-col gap-8'
                }
              >
                {priorityItem ? (
                  <Section title="Ưu tiên tiếp theo">
                    <PriorityNextCard item={priorityItem} now={now} />
                  </Section>
                ) : null}
                {hasProgress ? (
                  <div className={hasPriority ? 'hidden lg:block' : undefined}>
                    <Section title="Tiến độ hôm nay">
                      <TodayProgressCard completedTodayCount={completedTodayCount} totalTodayCount={totalTodayCount} />
                    </Section>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

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

              <Section className="animate-section-in" style={{ animationDelay: '120ms' }} title={`Hôm nay (${todayItems.length})`}>
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

          {/* Mobile/tablet-only standalone Progress slot — see the Focus-group comment above for
              why this is a second DOM instance rather than a repositioned single one. Independent
              of isFullyEmpty by design (same reasoning as Active Context below): a day can have
              zero remaining active todos/activities (isFullyEmpty) while still having completed
              something today (e.g. 3 todos due today, all 3 done) — Progress should still show
              "3/3, Bạn đã hoàn thành..." instead of disappearing just because nothing is left to
              do. Self-gated purely on totalTodayCount > 0. */}
          {hasProgress ? (
            <div className="w-full animate-section-in lg:hidden lg:max-w-[560px]" style={{ animationDelay: '140ms' }}>
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
              when there's room. Width bumped 380px -> 400px (Phase 5 §7, within the 360-420px
              target) to give the card's existing content a little more breathing room; no content/
              semantics change. */}
          {contexts.length > 0 ? (
            <Section className="animate-section-in" style={{ animationDelay: '160ms' }} title="Đang diễn ra">
              <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
                {contexts.map((context) => (
                  <div className="w-full lg:max-w-[400px]" key={`${context.kind}:${context.planId}`}>
                    <TodayContextCard context={context} />
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {isFullyEmpty ? null : (
            <>
              {upcomingItems.length > 0 ? (
                <Section
                  className="animate-section-in"
                  style={{ animationDelay: '200ms' }}
                  title={`Sắp tới (${upcomingItems.length})`}
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

          {/* Independent of isFullyEmpty — same "you may have finished everything" reasoning as
              Progress above. Compact borderless list (no per-item Card chrome), max 3 items
              already enforced by buildRecentlyCompletedItems. */}
          {recentlyCompletedItems.length > 0 ? (
            <div className="w-full animate-section-in lg:max-w-[560px]" style={{ animationDelay: '240ms' }}>
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
