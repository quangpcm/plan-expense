'use client';

import { useRouter } from 'next/navigation';
import { CalendarClock, ListChecks } from 'lucide-react';

import { Badge } from '@/shared/components/ui/badge';
import { DataRow } from '@/shared/components/ui/data-row';
import { formatDueCountdown } from '@/shared/utils/date';
import type { TodaySummaryItem, TodaySummaryItemKind } from '@/modules/today/types/today-summary';

type TodayItemRowProps = {
  item: TodaySummaryItem;
};

const TYPE_LABEL: Record<TodaySummaryItemKind, string> = {
  todo: 'Công việc',
  travelActivity: 'Lịch trình',
};

const TYPE_ICON: Record<TodaySummaryItemKind, typeof ListChecks> = {
  todo: ListChecks,
  travelActivity: CalendarClock,
};

// Resolved in product code, not on Badge — Badge's tone vocabulary stays generic
// (docs/design-system/ComponentUsage.md, Badge section).
const URGENCY_BADGE_VARIANT: Record<TodaySummaryItem['urgency'], 'neutral' | 'info' | 'warning' | 'danger'> = {
  overdue: 'danger',
  danger: 'warning',
  warning: 'info',
  normal: 'neutral',
};

// TodaySummaryItem doesn't carry a stored route (Phase 1-3 data layer, out of
// scope for this UI phase) — constructed here from the existing, already-used
// tab + detail-id query contract (plan-module-registry.ts, and the todoId/
// activityId params the plan detail page already reads).
function resolveTodayItemHref(item: TodaySummaryItem): string {
  const basePath = `/plans/${item.planId}`;

  if (item.kind === 'todo') {
    return `${basePath}?tab=todos&todoId=${item.itemId}`;
  }

  return `${basePath}?tab=travelItinerary&activityId=${item.itemId}`;
}

// Product-specific — a Today row shows type, title, source plan, and due
// context together, which doesn't fit any existing domain row precedent
// (closest is the plain "upcoming todo" DataRow rows in Wedding Overview;
// this composes the same DataRow contract, single interaction zone: the
// whole row navigates, so it fits DataRow's supported shape as-is).
export function TodayItemRow({ item }: TodayItemRowProps) {
  const router = useRouter();
  const Icon = TYPE_ICON[item.kind];

  return (
    <DataRow
      className="rounded-[var(--radius-ds-xl)] border border-[var(--color-border-default)] px-4 hover:border-[var(--color-border-strong)]"
      leading={
        <div className="flex size-9 items-center justify-center rounded-full bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)]">
          <Icon aria-hidden="true" className="size-4" />
        </div>
      }
      main={
        <div className="min-w-0 space-y-1">
          <Badge variant="neutral">{TYPE_LABEL[item.kind]}</Badge>
          <p className="truncate text-body-strong text-[var(--color-text-primary)]">{item.title}</p>
          <p className="truncate text-metadata text-[var(--color-text-secondary)]">{item.planName}</p>
        </div>
      }
      onClick={() => router.push(resolveTodayItemHref(item))}
      status={
        item.dueAt ? (
          <Badge variant={URGENCY_BADGE_VARIANT[item.urgency]}>{formatDueCountdown(item.dueAt.toDate())}</Badge>
        ) : null
      }
    />
  );
}
