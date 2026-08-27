'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';

import { AppBottomNav } from '@/shared/components/layout/app-bottom-nav';
import { AppHeader } from '@/shared/components/layout/app-header';
import { RouteLoadingScreen } from '@/shared/components/layout/route-loading-screen';

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
    <div className="flex min-h-screen flex-col" onClickCapture={handleNavigationIntent}>
      {isRouteTransitionVisible ? (
        <div className="pointer-events-none fixed inset-0 z-50 bg-[rgba(246,248,252,0.74)] backdrop-blur-[6px]">
          <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col justify-center px-4 pb-8 sm:px-6 lg:px-6">
            <RouteLoadingScreen
              title="Đang tải nội dung..."
              description="Chỉ mất một chút thời gian."
            />
          </div>
        </div>
      ) : null}
      <AppHeader />
      <div className="mx-auto w-full max-w-[1500px] flex-1 px-4 pb-[calc(4.5rem_+_env(safe-area-inset-bottom))] pt-5 sm:px-6 md:pb-8 lg:px-6">
        {children}
      </div>
      <AppBottomNav />
    </div>
  );
}
