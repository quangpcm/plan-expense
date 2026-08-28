'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, Plane } from 'lucide-react';

import type { TodayContextItem } from '@/modules/today/types/today-summary';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';
import { formatTime } from '@/shared/utils/date';

type TodayContextStripProps = {
  contexts: TodayContextItem[];
};

function buildContextSummary(context: TodayContextItem): string {
  if (context.nextActivity) {
    return `Tiếp theo ${formatTime(context.nextActivity.startsAt.toDate())} — ${context.nextActivity.title}`;
  }

  return 'Hôm nay không có lịch trình';
}

export function TodayContextStrip({ contexts }: TodayContextStripProps) {
  const router = useRouter();
  const primaryContext = contexts[0];

  if (!primaryContext) {
    return null;
  }

  const extraCount = Math.max(contexts.length - 1, 0);

  return (
    <button
      className="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-[var(--radius-ds-md)] px-4 py-3 text-left outline-none transition hover:bg-[var(--color-surface-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-inset"
      onClick={() => router.push(`/plans/${primaryContext.planId}?tab=travelItinerary`)}
      type="button"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand-primary)]">
          <Plane aria-hidden="true" className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="min-w-0 space-y-0.5">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-body-strong text-[var(--color-text-primary)]">{primaryContext.planName}</p>
              <Badge className="shrink-0 bg-[var(--color-brand-subtle)] text-[var(--color-brand-primary)]" variant="info">
                Ngày {primaryContext.currentDay}/{primaryContext.totalDays}
              </Badge>
              {extraCount > 0 ? <Badge variant="neutral">+{extraCount}</Badge> : null}
            </div>
            <p className="truncate text-metadata text-[var(--color-text-secondary)]">{buildContextSummary(primaryContext)}</p>
          </div>
        </div>
      </div>
      <ChevronRight
        aria-hidden="true"
        className={cn('size-4 shrink-0 text-[var(--color-text-muted)]', extraCount > 0 ? 'md:ml-2' : undefined)}
      />
    </button>
  );
}
