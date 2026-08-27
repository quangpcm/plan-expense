'use client';

import { useEffect, useState } from 'react';

import { resolveTodayProgressCopy } from '@/modules/today/utils/today-progress';

type TodayProgressSummaryProps = {
  completedTodayCount: number;
  totalTodayCount: number;
};

export function TodayProgressSummary({ completedTodayCount, totalTodayCount }: TodayProgressSummaryProps) {
  if (totalTodayCount === 0) {
    return null;
  }

  const percentage = Math.round((completedTodayCount / totalTodayCount) * 100);
  const supportingCopy = resolveTodayProgressCopy({ completedTodayCount, totalTodayCount });
  const [displayPercentage, setDisplayPercentage] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDisplayPercentage(percentage));
    return () => cancelAnimationFrame(frame);
  }, [percentage]);

  return (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-body-strong text-[var(--color-text-primary)]">{supportingCopy}</p>
        </div>
        <p className="shrink-0 text-body-strong text-[var(--color-text-primary)]">
          {completedTodayCount} / {totalTodayCount} hoàn thành
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-2.5 w-full max-w-[360px] overflow-hidden rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-default)]">
          <div
            className="h-full rounded-full bg-[var(--color-brand-primary)] transition-[width] duration-[400ms] ease-out"
            style={{ width: `${displayPercentage}%` }}
          />
        </div>
        <p className="shrink-0 text-metadata text-[var(--color-text-secondary)]">{percentage}%</p>
      </div>
    </div>
  );
}
