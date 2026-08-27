'use client';

import { useCallback, useEffect, useState } from 'react';

import { useAuthStore } from '@/shared/stores/auth.store';
import { todaySummaryService } from '@/modules/today/services';
import type { TodaySummaryDocument } from '@/modules/today/types/today-summary';
import { getDateKey } from '@/modules/today/utils/today-summary-freshness';
import { readTodaySummaryCache, writeTodaySummaryCache } from '@/modules/today/utils/today-summary-local-cache';
import { validateTodaySummary } from '@/modules/today/utils/today-summary-validation';

export type UseTodaySummaryResult = {
  summary: TodaySummaryDocument | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  refresh: () => void;
};

type TodaySummaryState = {
  requestKey: string | null;
  summary: TodaySummaryDocument | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
};

function resolveTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function buildInitialState(userId: string | null, dateKey: string, timezone: string, requestKey: string | null): TodaySummaryState {
  if (!userId || !requestKey) {
    return { requestKey: null, summary: null, isLoading: false, isRefreshing: false, error: null };
  }

  // Synchronous — read once during render, not inside an effect. This is
  // what lets a cached summary render on the very first paint instead of
  // flashing a loading state, without tripping react-hooks/set-state-in-effect.
  const cached = readTodaySummaryCache({ userId, dateKey, timezone });

  return {
    requestKey,
    summary: cached,
    isLoading: !cached,
    isRefreshing: cached !== null,
    error: null,
  };
}

// Client lifecycle/orchestration only — cache validation, freshness
// evaluation, and rebuild-dedup all live in today-summary-local-cache.ts /
// today-summary-validation.ts, independently unit-tested there
// (docs/today-dashboard-specs.md).
export function useTodaySummary(): UseTodaySummaryResult {
  const userId = useAuthStore((state) => state.user?.uid ?? null);
  const [refreshToken, setRefreshToken] = useState(0);

  const timezone = resolveTimezone();
  const dateKey = getDateKey(new Date(), timezone);
  const requestKey = userId ? `${userId}:${dateKey}:${refreshToken}` : null;

  const [state, setState] = useState<TodaySummaryState>(() =>
    buildInitialState(userId, dateKey, timezone, requestKey),
  );

  // React-recommended "adjust state during render" pattern (not an effect)
  // for resetting/re-seeding state when the identity of what we're showing
  // changes — user logs out/in, the calendar day rolls over, or an explicit
  // refresh() bumped refreshToken. Synchronous setState here is intentional
  // and React-supported: it bails out the current render and re-renders
  // immediately, before anything commits or effects run.
  if (state.requestKey !== requestKey) {
    setState(buildInitialState(userId, dateKey, timezone, requestKey));
  }

  useEffect(() => {
    if (!userId || !requestKey) {
      return undefined;
    }

    let cancelled = false;
    const now = new Date();

    validateTodaySummary(todaySummaryService, { userId, timezone, dateKey, now })
      .then((result) => {
        if (cancelled) {
          return;
        }

        setState((previous) =>
          previous.requestKey === requestKey
            ? { ...previous, summary: result, isLoading: false, isRefreshing: false, error: null }
            : previous,
        );
        writeTodaySummaryCache({ userId, dateKey, timezone, summary: result, cachedAt: Date.now() });
      })
      .catch((caught: unknown) => {
        if (cancelled) {
          return;
        }

        // Final catch-all — logTodayFirestoreError in today-summary.service.ts
        // already logs the specific failing operation with its original
        // Firebase code/message; this just confirms what the hook itself
        // ends up surfacing to the UI as `error`, unmodified.
        console.error('[Today] useTodaySummary settled with an error', caught);

        // Intentionally leave `summary` untouched — SWR keeps showing
        // whatever was already visible (cached or previous) on failure.
        setState((previous) =>
          previous.requestKey === requestKey
            ? {
                ...previous,
                isLoading: false,
                isRefreshing: false,
                error: caught instanceof Error ? caught : new Error('Unable to load Today summary.'),
              }
            : previous,
        );
      });

    return () => {
      cancelled = true;
    };
  }, [userId, requestKey, dateKey, timezone]);

  const refresh = useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  return {
    summary: state.summary,
    isLoading: state.isLoading,
    isRefreshing: state.isRefreshing,
    error: state.error,
    refresh,
  };
}
