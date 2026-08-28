'use client';

import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';

type TodaySectionListProps<T> = {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  initialMobileCount: number;
  mobileRevealStep?: number;
  className?: string;
};

const DEFAULT_MOBILE_REVEAL_STEP = 3;

// Today-specific list arrangement — still product-local, not a new shared DS abstraction. The
// redesign direction for Today is a single content column across breakpoints, so the list stays
// vertical on desktop/tablet/mobile alike and only owns progressive disclosure via "Xem thêm".
// Single current consumer (TodayPage's three sections) — not proposed as a generic list shell.
export function TodaySectionList<T>({
  items,
  getKey,
  renderItem,
  initialMobileCount,
  mobileRevealStep = DEFAULT_MOBILE_REVEAL_STEP,
  className,
}: TodaySectionListProps<T>) {
  const [mobileVisibleCount, setMobileVisibleCount] = useState(initialMobileCount);
  const visibleMobileItems = items.slice(0, mobileVisibleCount);
  const remainingMobileCount = items.length - visibleMobileItems.length;

  return (
    <div className={className}>
      <div className="flex flex-col gap-2">
        {visibleMobileItems.map((item, index) => (
          <div className={index >= initialMobileCount ? 'animate-section-in' : undefined} key={getKey(item)}>
            {renderItem(item)}
          </div>
        ))}
        {remainingMobileCount > 0 ? (
          <button
            className="inline-flex min-h-11 items-center gap-1.5 self-start px-1 text-sm font-medium text-[var(--color-brand-primary)] transition-colors hover:text-[var(--color-primary-hover)]"
            onClick={() => setMobileVisibleCount((count) => Math.min(count + mobileRevealStep, items.length))}
            type="button"
          >
            Xem thêm {Math.min(remainingMobileCount, mobileRevealStep)} mục
            <ChevronDown aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
