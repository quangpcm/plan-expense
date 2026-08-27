'use client';

import { useRouter } from 'next/navigation';
import { CalendarClock, ListChecks } from 'lucide-react';

import { Badge } from '@/shared/components/ui/badge';
import { DataRow } from '@/shared/components/ui/data-row';
import { formatDueCountdown, formatTime } from '@/shared/utils/date';
import type { TodaySummaryItem, TodaySummaryItemKind } from '@/modules/today/types/today-summary';

type TodayItemCardProps = {
  item: TodaySummaryItem;
};

const TYPE_LABEL: Record<TodaySummaryItemKind, string> = {
  todo: 'Công việc',
  travelActivity: 'Lịch trình',
};

// Exported for reuse by PriorityNextCard (today-priority.ts consumer) — same type identity must
// stay visually consistent between the spotlight card and its home section row.
export const TYPE_ICON: Record<TodaySummaryItemKind, typeof ListChecks> = {
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
// activityId params the plan detail page already reads). Exported for reuse by PriorityNextCard,
// which navigates to the exact same destination as the item's own section-row card.
export function resolveTodayItemHref(item: TodaySummaryItem): string {
  const basePath = `/plans/${item.planId}`;

  if (item.kind === 'todo') {
    return `${basePath}?tab=todos&todoId=${item.itemId}`;
  }

  return `${basePath}?tab=travelItinerary&activityId=${item.itemId}`;
}

// Audit finding: Todo's `dueDate` is a date-only deadline end-to-end (todo-form.tsx's DateField is
// `type="date"`, and todo.service.ts/firestore-todo.repository.ts convert the plain YYYY-MM-DD
// string straight through `new Date(...)`/`Timestamp.fromDate`) — no user-entered time-of-day ever
// reaches storage. `item.urgency === 'danger'` means the bucketing layer already placed this Todo
// in the "Hôm nay" window (today-summary-bucketing.ts), so a hour/minute countdown here
// (`formatDueCountdown` falling through to its same-day branch) would report elapsed-time-since-
// midnight as if it were a real "you're 3 hours late" fact the user set — it isn't. Showing a
// plain "Hôm nay" label for that bucket is the honest presentation; day-level lateness in Cần chú
// ý ("Trễ N ngày") and upcoming day counts stay legitimate, since those are calendar-day facts, not
// fabricated sub-day precision.
function renderTodoStatus(item: TodaySummaryItem) {
  if (!item.dueAt) {
    return null;
  }

  if (item.urgency === 'danger') {
    return (
      <Badge className="border border-[var(--color-border-strong)] bg-[var(--color-surface-default)]" variant="neutral">
        Hôm nay
      </Badge>
    );
  }

  return (
    <Badge className="border border-transparent" variant={URGENCY_BADGE_VARIANT[item.urgency]}>
      {formatDueCountdown(item.dueAt.toDate())}
    </Badge>
  );
}

// Travel Activity's dueAt is a real schedule time (startsAt, entered via a datetime input) — its
// clock time is the useful, honest signal here, unlike a Todo's date-only deadline above.
function renderStatus(item: TodaySummaryItem) {
  if (!item.dueAt) {
    return null;
  }

  if (item.kind === 'travelActivity') {
    return (
      <Badge className="border border-[var(--color-border-strong)] bg-[var(--color-surface-default)]" variant="neutral">
        {formatTime(item.dueAt.toDate())}
      </Badge>
    );
  }

  return renderTodoStatus(item);
}

// Product-specific — a Today card shows type, title, source plan, and due context together, which
// doesn't fit any existing domain row precedent (closest is the plain "upcoming todo" DataRow rows
// in Wedding Overview). Still composes DataRow's leading/main/status anatomy as-is — the only thing
// that changes between the desktop 3-up row and the mobile full-width list (see
// today-section-list.tsx) is the *outer* wrapper's width/arrangement, never this card's own
// border/shadow/hover identity, so it doesn't trip DataRow's "distinct visual identity per
// breakpoint" anti-pattern (docs/design-system/ComponentUsage.md, DataRow section).
//
// Hierarchy: title first (most prominent, bumped to `text-component-title`), plan name second
// (muted context), due/urgency or schedule time on the trailing side. Type is conveyed by the
// leading icon shape plus an `sr-only` accessible label — no visible "· Công việc" text anymore,
// since the icon already carries it for sighted users.
export function TodayItemCard({ item }: TodayItemCardProps) {
  const router = useRouter();
  const Icon = TYPE_ICON[item.kind];
  const isAttention = item.urgency === 'overdue';

  return (
    <DataRow
      className="w-full rounded-[var(--radius-ds-xl)] border border-[var(--color-border-strong)] bg-[var(--color-surface-default)] px-4 hover:border-[var(--color-text-muted)] hover:bg-[var(--color-surface-default)]"
      density="compact"
      leading={
        <div
          className={
            isAttention
              ? 'flex size-9 items-center justify-center rounded-full bg-[var(--color-status-danger-surface)] text-[color:var(--color-status-danger)]'
              : 'flex size-9 items-center justify-center rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] text-[var(--color-text-primary)]'
          }
        >
          <Icon aria-hidden="true" className="size-[18px]" />
          <span className="sr-only">{TYPE_LABEL[item.kind]}</span>
        </div>
      }
      main={
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-component-title text-[var(--color-text-primary)]">{item.title}</p>
          <p className="truncate text-metadata text-[var(--color-text-secondary)]">{item.planName}</p>
        </div>
      }
      onClick={() => router.push(resolveTodayItemHref(item))}
      status={renderStatus(item)}
    />
  );
}
