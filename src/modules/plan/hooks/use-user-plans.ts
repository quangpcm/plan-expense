'use client';

import { useEffect, useState } from 'react';

import { planService } from '@/modules/plan/services';
import type { PlanSummary } from '@/modules/plan/types/plan';
import { readUserPlansCache, writeUserPlansCache } from '@/modules/plan/utils/plan-local-cache';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';

export function useUserPlans() {
  const { user, isAuthenticated } = useAuthSession();
  // Lazy initializer — read once during render, not inside an effect, so a
  // cached plan list renders on the very first paint instead of flashing a
  // loading state (mirrors use-today-summary.ts's buildInitialState).
  const [initialCache] = useState(() => (user?.uid ? readUserPlansCache({ userId: user.uid }) : null));
  const [plans, setPlans] = useState<PlanSummary[]>(() => initialCache ?? []);
  const [isLoading, setIsLoading] = useState(() => initialCache === null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canWatchPlans = isAuthenticated && Boolean(user?.uid);

  useEffect(() => {
    if (!canWatchPlans || !user?.uid) {
      return undefined;
    }

    const unsubscribe = planService.watchUserPlans(
      user.uid,
      (items) => {
        setPlans(items);
        setErrorMessage(null);
        setIsLoading(false);
        writeUserPlansCache({ userId: user.uid, plans: items });
      },
      (error) => {
        // Keep showing whatever is already visible (cached or previous live
        // data) on failure instead of wiping to empty — same SWR semantics
        // as use-today-summary.ts.
        setErrorMessage(error.message);
        setIsLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [canWatchPlans, user?.uid]);

  return {
    plans: canWatchPlans ? plans : [],
    isLoading: canWatchPlans ? isLoading : false,
    errorMessage,
  };
}
