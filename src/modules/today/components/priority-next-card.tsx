'use client';

import { useRouter } from 'next/navigation';

import { resolveTodayItemHref, TYPE_ICON } from '@/modules/today/components/today-item-card';
import type { TodaySummaryItem, TodaySummaryItemKind } from '@/modules/today/types/today-summary';
import { resolvePriorityUrgency } from '@/modules/today/utils/today-priority';
import { Badge } from '@/shared/components/ui/badge';

type PriorityNextCardProps = {
  item: TodaySummaryItem;
  now: Date;
};

const CTA_LABEL: Record<TodaySummaryItemKind, string> = {
  todo: 'Mở công việc',
  travelActivity: 'Mở lịch trình',
};

// Product-specific — a two-column spotlight (icon+title/plan on the left, a compact status badge
// stacked over the CTA on the right), which doesn't fit DataRow's one-line leading/main/status/
// trailing anatomy (closest rejected precedent: SettlementSuggestionCard, which also needed more
// structure than one DataRow slot). Rendered as a plain <button> replicating Card's own visual
// recipe (identical border/radius/shadow/padding values, not new ones) instead of nesting an inner
// link/button inside a Card div — the whole surface is one interaction zone, and
// "Mở công việc/lịch trình →" is decorative text inside it, not a second nested interactive element
// (the exact nested-interactive anti-pattern documented for DataRow/Collapsible in
// docs/design-system/ComponentUsage.md).
//
// Kept deliberately close to TodayItemCard's own footprint (~1.3-1.5x, not 2-3x) — prominence comes
// from a slightly larger icon, stronger title weight, a right-hand CTA and light elevation, not
// from extra empty space or a full-width status bar.
export function PriorityNextCard({ item, now }: PriorityNextCardProps) {
  const router = useRouter();
  const Icon = TYPE_ICON[item.kind];
  const urgency = resolvePriorityUrgency(item, now);

  return (
    <button
      className="flex w-full items-stretch justify-between gap-3 rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[color:var(--color-surface-default)] p-4 text-left shadow-[0_18px_54px_rgba(23,32,51,0.06)] outline-none transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[0_20px_70px_rgba(23,32,51,0.08)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2"
      onClick={() => router.push(resolveTodayItemHref(item))}
      type="button"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="text-metadata font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
          Nên làm trước
        </div>

        <div className="flex min-w-0 items-stretch gap-2.5">
          <div className="flex size-10 shrink-0 items-center justify-center self-start rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand-primary)]">
            <Icon aria-hidden="true" className="size-[18px]" />
          </div>
          <div className="flex min-w-0 flex-col justify-between">
            <p className="truncate text-component-title text-[var(--color-text-primary)]">{item.title}</p>
            <p className="truncate text-metadata text-[var(--color-text-secondary)]">{item.planName}</p>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between gap-1">
        {urgency ? <Badge variant={urgency.tone}>{urgency.label}</Badge> : null}
        <span className="text-sm font-medium text-[var(--color-brand-primary)]">{CTA_LABEL[item.kind]} →</span>
      </div>
    </button>
  );
}
