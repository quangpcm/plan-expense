'use client';

import { useRouter } from 'next/navigation';
import { Plane } from 'lucide-react';

import type { TodayContextItem } from '@/modules/today/types/today-summary';
import { Badge } from '@/shared/components/ui/badge';
import { formatCompactDateRange, formatTime } from '@/shared/utils/date';

type TodayContextCardProps = {
  context: TodayContextItem;
};

// Product-specific — Travel-only for V1 (docs/design-sys-v2/today-ui.md Phase 4 scoping: Wedding
// has no dedicated wedding-date field or "important task" query yet, Event plans have no
// time-of-day data at all — see today-context.ts). `Plane` reuses the same icon already used for
// PlanType 'travel' elsewhere (plan.constants.ts, plan-card-visuals.ts). Date range uses
// formatCompactDateRange (Phase 4.1) — a new shared util (src/shared/utils/date.ts), not a
// duplicate of overview-widget-registry.tsx's private formatDateRange, which is a different,
// full-precision dd/MM/yyyy style for a different context. Rendered as a plain <button>
// replicating Card's own visual recipe, same technique as PriorityNextCard — one clickable
// surface, no separate CTA text (Phase 3.1: the whole card is the affordance, nothing extra to
// avoid a redundant CTA). Stays width-agnostic (`w-full`) — the caller controls sizing/arrangement
// (compact desktop width, 1-2 cards side by side), same separation already used by TodayItemCard.
// Phase 5: bumped p-4 -> p-5 (breathing room for the fuller info this card already carries) and
// added the app's established restrained hover-lift (-translate-y-0.5 + heavier shadow), the same
// recipe already used by PriorityNextCard/PlanCard/overview-widget-registry cards — not a new value.
export function TodayContextCard({ context }: TodayContextCardProps) {
  const router = useRouter();
  const otherActivitiesToday = Math.max(context.remainingActivitiesToday - (context.nextActivity ? 1 : 0), 0);

  return (
    <button
      className="flex w-full flex-col gap-2 rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[color:var(--color-surface-default)] p-5 text-left shadow-[0_18px_54px_color-mix(in_srgb,var(--color-overlay-backdrop)_18%,transparent)] outline-none transition hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[0_20px_70px_color-mix(in_srgb,var(--color-overlay-backdrop)_24%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-page)]"
      onClick={() => router.push(`/plans/${context.planId}?tab=travelItinerary`)}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand-primary)]">
            <Plane aria-hidden="true" className="size-[18px]" />
          </div>
          <p className="truncate text-component-title text-[var(--color-text-primary)]">{context.planName}</p>
        </div>
        <Badge className="shrink-0" variant="info">
          Ngày {context.currentDay}/{context.totalDays}
        </Badge>
      </div>

      <p className="text-metadata text-[var(--color-text-secondary)]">
        {formatCompactDateRange(context.startDate.toDate(), context.endDate.toDate())}
      </p>

      {context.nextActivity ? (
        <div className="space-y-0.5">
          <p className="text-metadata text-[var(--color-text-secondary)]">Tiếp theo</p>
          <p className="truncate text-body-strong text-[var(--color-text-primary)]">
            {formatTime(context.nextActivity.startsAt.toDate())} · {context.nextActivity.title}
          </p>
        </div>
      ) : (
        <p className="text-body text-[var(--color-text-secondary)]">Hôm nay chưa có lịch trình.</p>
      )}

      {otherActivitiesToday > 0 ? (
        <p className="text-metadata text-[var(--color-text-secondary)]">
          Còn {otherActivitiesToday} hoạt động khác hôm nay
        </p>
      ) : null}
    </button>
  );
}
