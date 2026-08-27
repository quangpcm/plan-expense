'use client';

import { useEffect, useState } from 'react';

import { resolveTodayProgressCopy } from '@/modules/today/utils/today-progress';
import { Card } from '@/shared/components/ui/card';

type TodayProgressCardProps = {
  completedTodayCount: number;
  totalTodayCount: number;
};

// Product-specific — compact progress summary, same compact Card recipe as DailyBrief (py-4,
// tight gap), no separate eyebrow label (Phase 4.1: redundant with the "Tiến độ hôm nay" Section
// heading the caller already renders above it). The bar itself (h-2 track + h-full fill, inline
// width%) copies the existing hand-rolled recipe from SettlementProgressSummary rather than
// inventing a new one — this is at least a 5th instance of that pattern across the app (Wedding
// Overview, Dashboard PlanCard, Statistic's FinanceBudgetProgress/FinanceMilestoneBars/
// ComparisonBar, Settlement), so the evidence for a real Progress primitive
// (docs/design-system/ExceptionsAndDebt.md, deferred item 1) keeps accumulating — flagging it here
// rather than silently adding a 6th bespoke one. Colored brand, not the settlement one's
// success-green: this feature explicitly asked for neutral/brand treatment, not "green to look
// positive" when nothing in the Design System semantics requires it. The track carries its own
// border (not just a fill-colored background) so it stays visibly a track even at 0% completion.
export function TodayProgressCard({ completedTodayCount, totalTodayCount }: TodayProgressCardProps) {
  const percentage = totalTodayCount > 0 ? Math.round((completedTodayCount / totalTodayCount) * 100) : 0;
  const supportingCopy = resolveTodayProgressCopy({ completedTodayCount, totalTodayCount });

  // Fill-on-mount motion (Phase 5 §14): the bar must render at 0% first, then transition to the
  // real percentage — a CSS transition never fires on a value already present at first paint, so
  // this needs one deferred state update. `prefers-reduced-motion` is handled globally
  // (globals.css collapses all transition-duration to ~0, independent of this component), not
  // re-implemented here.
  const [displayPercentage, setDisplayPercentage] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDisplayPercentage(percentage));
    return () => cancelAnimationFrame(frame);
  }, [percentage]);

  return (
    <Card className="gap-2 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-body-strong text-[var(--color-text-primary)]">
          {completedTodayCount} / {totalTodayCount} việc đã hoàn thành
        </p>
        <p className="text-body-strong text-[var(--color-text-primary)]">{percentage}%</p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)]">
        <div
          className="h-full rounded-full bg-[var(--color-brand-primary)] transition-[width] duration-[400ms] ease-out"
          style={{ width: `${displayPercentage}%` }}
        />
      </div>
      <p className="text-metadata text-[var(--color-text-secondary)]">{supportingCopy}</p>
    </Card>
  );
}
