'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';

import { getAppNavigationItems } from '@/shared/components/layout/navigation-items';
import { RouteLoadingScreen } from '@/shared/components/layout/route-loading-screen';
import { Sidebar } from '@/shared/components/layout/sidebar';
import { cn } from '@/shared/utils/cn';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const ROUTE_LOADING_DELAY_MS = 240;
  const ROUTE_LOADING_MIN_VISIBLE_MS = 360;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = useMemo(() => `${pathname}?${searchParams.toString()}`, [pathname, searchParams]);
  const [isRouteTransitionVisible, setIsRouteTransitionVisible] = useState(false);
  const navigationStartedAtRef = useRef<number | null>(null);
  const pendingRouteKeyRef = useRef<string | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const showTimeoutRef = useRef<number | null>(null);

  const navigationItems = getAppNavigationItems(pathname);

  useEffect(() => {
    if (!isRouteTransitionVisible || pendingRouteKeyRef.current === null) {
      return;
    }

    if (pendingRouteKeyRef.current === routeKey) {
      const elapsed = navigationStartedAtRef.current ? Date.now() - navigationStartedAtRef.current : 0;
      const remaining = Math.max(ROUTE_LOADING_MIN_VISIBLE_MS - elapsed, 0);

      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
      }

      if (showTimeoutRef.current) {
        window.clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }

      hideTimeoutRef.current = window.setTimeout(() => {
        setIsRouteTransitionVisible(false);
        pendingRouteKeyRef.current = null;
        navigationStartedAtRef.current = null;
        hideTimeoutRef.current = null;
      }, remaining);
    }
  }, [isRouteTransitionVisible, routeKey]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
      }

      if (showTimeoutRef.current) {
        window.clearTimeout(showTimeoutRef.current);
      }
    };
  }, [ROUTE_LOADING_MIN_VISIBLE_MS]);

  function handleNavigationIntent(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const anchor = target?.closest('a');

    if (!anchor) {
      return;
    }

    const href = anchor.getAttribute('href');

    if (!href || href.startsWith('#') || anchor.target === '_blank' || anchor.hasAttribute('download')) {
      return;
    }

    let nextUrl: URL;

    try {
      nextUrl = new URL(href, window.location.href);
    } catch {
      return;
    }

    if (nextUrl.origin !== window.location.origin) {
      return;
    }

    const nextRouteKey = `${nextUrl.pathname}?${nextUrl.searchParams.toString()}`;

    if (nextRouteKey === routeKey) {
      return;
    }

    navigationStartedAtRef.current = Date.now();
    pendingRouteKeyRef.current = nextRouteKey;

    if (showTimeoutRef.current) {
      window.clearTimeout(showTimeoutRef.current);
    }

    showTimeoutRef.current = window.setTimeout(() => {
      if (pendingRouteKeyRef.current === nextRouteKey) {
        setIsRouteTransitionVisible(true);
      }

      showTimeoutRef.current = null;
    }, ROUTE_LOADING_DELAY_MS);
  }

  return (
    <div
      onClickCapture={handleNavigationIntent}
      className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-4 sm:px-6 lg:flex-row lg:items-start lg:gap-6 lg:px-6"
      style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
    >
      {isRouteTransitionVisible ? (
        <div className="pointer-events-none fixed inset-0 z-50 bg-[rgba(246,248,252,0.74)] backdrop-blur-[6px]">
          <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col justify-center px-4 pb-28 sm:px-6 lg:px-6">
            <RouteLoadingScreen
              title="Đang tải nội dung..."
              description="Chỉ mất một chút thời gian."
            />
          </div>
        </div>
      ) : null}
      <Sidebar />
      <div className="min-w-0 flex-1 pb-28 lg:pb-8">{children}</div>
      <nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto max-w-3xl px-3 pt-3 sm:px-4 sm:pt-4 lg:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="pointer-events-auto grid grid-cols-2 rounded-[24px] border border-white/60 bg-slate-950/95 p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.3)] backdrop-blur sm:rounded-[28px] sm:p-2">
          {navigationItems.map(({ href, label, icon: Icon, active }) => (
            <Link
              key={label}
              className={cn(
                'flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-[18px] px-2 py-1.5 text-[10px] font-medium leading-none text-slate-400 transition sm:min-h-14 sm:gap-1 sm:rounded-[20px] sm:px-3 sm:py-2 sm:text-[11px]',
                active && 'bg-white/12 text-white',
              )}
              href={href}
            >
              <Icon className="size-[15px] sm:size-4" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
