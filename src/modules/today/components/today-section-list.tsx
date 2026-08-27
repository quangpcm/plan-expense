'use client';

import { useState, type ReactNode } from 'react';

type TodaySectionListProps<T> = {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  initialMobileCount: number;
  mobileRevealStep?: number;
};

const DEFAULT_MOBILE_REVEAL_STEP = 3;

// Today-specific list arrangement — not a shared Design System primitive, and deliberately kept
// out of src/shared/components/ui/*. Desktop (>=1024px, the project's own `lg:`/Desktop breakpoint
// per VisualRules.md) renders every item in one evenly-divided horizontal row (each item pinned to
// ~1/3 width so 1-2 items never stretch to fill the row) with light native overflow-x + scroll-snap
// once there are more than 3 — the native scrollbar itself is hidden (cross-browser: scrollbar-width,
// -ms-overflow-style, ::-webkit-scrollbar) while wheel/trackpad/touch scrolling stays fully
// functional, so the row reads as a designed list rather than a technical scroll container.
// Mobile *and* Tablet (<1024px) render a vertical list progressively
// disclosed via "Xem thêm" instead of horizontal scrolling — Tablet deliberately reuses the
// mobile-style list rather than a cramped 3-up row, one of the two options the spec explicitly
// allows for that width range. Single current consumer (TodayPage's three sections) — not proposed
// as a generic carousel/list abstraction (no new dependency, no auto-slide, no shared API).
export function TodaySectionList<T>({
  items,
  getKey,
  renderItem,
  initialMobileCount,
  mobileRevealStep = DEFAULT_MOBILE_REVEAL_STEP,
}: TodaySectionListProps<T>) {
  const [mobileVisibleCount, setMobileVisibleCount] = useState(initialMobileCount);
  const visibleMobileItems = items.slice(0, mobileVisibleCount);
  const remainingMobileCount = items.length - visibleMobileItems.length;

  return (
    <>
      <div className="hidden gap-3 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] lg:flex lg:snap-x lg:snap-mandatory [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <div className="shrink-0 grow-0 basis-[calc((100%-1.5rem)/3)] snap-start" key={getKey(item)}>
            {renderItem(item)}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 lg:hidden">
        {visibleMobileItems.map((item) => (
          <div key={getKey(item)}>{renderItem(item)}</div>
        ))}
        {remainingMobileCount > 0 ? (
          <button
            className="min-h-11 self-start px-1 text-sm font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-primary-hover)]"
            onClick={() => setMobileVisibleCount((count) => Math.min(count + mobileRevealStep, items.length))}
            type="button"
          >
            Xem thêm {Math.min(remainingMobileCount, mobileRevealStep)}
          </button>
        ) : null}
      </div>
    </>
  );
}
