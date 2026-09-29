'use client';

import { useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/shared/utils/cn';

interface PlanDetailMobileTab {
  id: string;
  label: string;
}

interface PlanDetailMobileTabsProps {
  tabs: PlanDetailMobileTab[];
  activeTab: string;
  onSelectTab: (tabId: string) => void;
}

/**
 * Mobile-only text tab bar for Plan Detail navigation (< sm breakpoint).
 * Centers tabs when they fit the container; switches to horizontal scroll
 * (with the active tab kept in view) once they overflow it. Desktop keeps
 * the existing icon+pill navigation untouched.
 */
export function PlanDetailMobileTabs({ tabs, activeTab, onSelectTab }: PlanDetailMobileTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [isCentered, setIsCentered] = useState(false);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const updateAlignment = () => {
      setIsCentered(container.scrollWidth <= container.clientWidth + 1);
    };

    updateAlignment();

    const resizeObserver = new ResizeObserver(updateAlignment);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [tabs]);

  useLayoutEffect(() => {
    tabRefs.current[activeTab]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'nearest',
      block: 'nearest',
    });
  }, [activeTab]);

  return (
    <div
      ref={scrollRef}
      aria-label="Điều hướng chi tiết kế hoạch"
      className={cn(
        'flex gap-1 overflow-x-auto',
        '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        isCentered ? 'justify-center' : 'justify-start',
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el;
            }}
            aria-selected={isActive}
            className={cn(
              'relative flex min-h-11 shrink-0 items-center whitespace-nowrap border-b-2 px-3 text-sm transition-colors duration-200',
              isActive ? 'border-[var(--color-brand-primary)]' : 'border-transparent',
            )}
            onClick={() => onSelectTab(tab.id)}
            role="tab"
            type="button"
          >
            {/* Reserves the tab's width at the (wider) semibold weight so switching
                active state never reflows sibling tabs. */}
            <span aria-hidden="true" className="invisible font-semibold">
              {tab.label}
            </span>
            <span
              className={cn(
                'absolute inset-0 flex items-center justify-center px-3',
                isActive
                  ? 'font-semibold text-[var(--color-brand-primary)]'
                  : 'font-medium text-[var(--color-text-secondary)]',
              )}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
