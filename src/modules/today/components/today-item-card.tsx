'use client';

import { useRouter } from 'next/navigation';
import { BriefcaseBusiness, CalendarClock, ListChecks, Plane } from 'lucide-react';

import { Badge } from '@/shared/components/ui/badge';
import { DataRow } from '@/shared/components/ui/data-row';
import { formatDueCountdown, formatTime } from '@/shared/utils/date';
import type { TodaySummaryItem, TodaySummaryItemKind } from '@/modules/today/types/today-summary';
import { inferTodoVisualCategory, TODO_VISUAL_CATEGORY_META } from '@/modules/today/utils/todo-visual-category';

type TodayItemCardProps = {
  item: TodaySummaryItem;
  section: 'attention' | 'today' | 'upcoming';
};

const TYPE_LABEL: Record<TodaySummaryItemKind, string> = {
  todo: 'Công việc',
  travelActivity: 'Lịch trình',
};

export const TYPE_ICON: Record<TodaySummaryItemKind, typeof ListChecks> = {
  todo: ListChecks,
  travelActivity: CalendarClock,
};

const URGENCY_BADGE_VARIANT: Record<TodaySummaryItem['urgency'], 'neutral' | 'info' | 'warning' | 'danger'> = {
  overdue: 'danger',
  danger: 'warning',
  warning: 'info',
  normal: 'neutral',
};

export function resolveTodayItemHref(item: TodaySummaryItem): string {
  const basePath = `/plans/${item.planId}`;

  if (item.kind === 'todo') {
    return `${basePath}?tab=todos&todoId=${item.itemId}`;
  }

  return `${basePath}?tab=travelItinerary&activityId=${item.itemId}`;
}

function renderTodoStatus(item: TodaySummaryItem, section: TodayItemCardProps['section']) {
  if (!item.dueAt) {
    return null;
  }

  if (item.urgency === 'danger' && section !== 'attention') {
    return (
      <Badge className="border border-transparent" variant="warning">
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

function renderStatus(item: TodaySummaryItem, section: TodayItemCardProps['section']) {
  if (!item.dueAt) {
    return null;
  }

  if (item.kind === 'travelActivity') {
    if (section === 'upcoming') {
      return <span className="text-metadata tabular-nums text-[var(--color-text-secondary)]">{formatDueCountdown(item.dueAt.toDate())}</span>;
    }

    return <span className="text-body-strong tabular-nums text-[var(--color-brand-primary)]">{formatTime(item.dueAt.toDate())}</span>;
  }

  if (section === 'upcoming') {
    return <span className="text-metadata text-[var(--color-text-secondary)]">{formatDueCountdown(item.dueAt.toDate())}</span>;
  }

  return renderTodoStatus(item, section);
}

function renderLeading(item: TodaySummaryItem, section: TodayItemCardProps['section']) {
  if (item.kind === 'todo') {
    const visualCategory = inferTodoVisualCategory(item.title);
    const meta = TODO_VISUAL_CATEGORY_META[visualCategory];
    const Icon = meta.icon;
    const isImmediate = section === 'attention' || section === 'today';
    const iconClassName = isImmediate ? meta.iconClassName : 'text-[var(--color-text-muted)]';
    const backgroundClassName = isImmediate ? meta.backgroundClassName : 'bg-[var(--color-surface-subtle)]';

    return (
      <div
        className={`flex size-9 items-center justify-center rounded-full border border-[var(--color-border-default)] ${backgroundClassName} ${iconClassName}`}
      >
        <Icon aria-hidden="true" className="size-4" />
        <span className="sr-only">{TYPE_LABEL[item.kind]}</span>
      </div>
    );
  }

  return (
    <div className="flex size-9 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand-primary)]">
      <Plane aria-hidden="true" className="size-4" />
      <span className="sr-only">{TYPE_LABEL[item.kind]}</span>
    </div>
  );
}

function renderMetadata(item: TodaySummaryItem) {
  const kindLabel = item.kind === 'todo' ? 'Công việc' : 'Lịch trình';

  return (
    <div className="flex min-w-0 items-center gap-1.5 text-metadata text-[var(--color-text-secondary)]">
      <BriefcaseBusiness aria-hidden="true" className="size-3.5 shrink-0 text-[var(--color-text-muted)]" />
      <span className="truncate font-medium text-[var(--color-text-primary)]">{item.planName}</span>
      <span aria-hidden="true" className="shrink-0 text-[var(--color-text-muted)]">
        ·
      </span>
      <span className="truncate text-[var(--color-text-secondary)]">{kindLabel}</span>
    </div>
  );
}

export function TodayItemCard({ item, section }: TodayItemCardProps) {
  const router = useRouter();

  const className =
    section === 'upcoming'
      ? 'w-full rounded-[var(--radius-ds-md)] border-b border-[var(--color-border-subtle)] px-0 py-3 last:border-b-0 hover:bg-[var(--color-surface-subtle)]'
      : section === 'attention'
        ? 'w-full rounded-[var(--radius-ds-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-default)] px-4 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)]'
        : 'w-full rounded-[var(--radius-ds-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-default)] px-4 hover:border-[var(--color-border-default)] hover:bg-[var(--color-surface-subtle)]';

  return (
    <DataRow
      className={className}
      density={section === 'upcoming' ? 'compact' : 'comfortable'}
      leading={renderLeading(item, section)}
      main={
        <div className="min-w-0 space-y-1">
          <p className={section === 'upcoming' ? 'truncate text-body-strong text-[var(--color-text-primary)]' : 'truncate text-component-title text-[var(--color-text-primary)]'}>
            {item.title}
          </p>
          {renderMetadata(item)}
        </div>
      }
      onClick={() => router.push(resolveTodayItemHref(item))}
      status={renderStatus(item, section)}
    />
  );
}
