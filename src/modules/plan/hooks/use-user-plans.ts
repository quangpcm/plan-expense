'use client';

import { useEffect, useState } from 'react';

import { planService } from '@/modules/plan/services';
import type { PlanSummary } from '@/modules/plan/types/plan';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';

export function useUserPlans() {
  const { user, isAuthenticated } = useAuthSession();
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const canWatchPlans = isAuthenticated && Boolean(user?.uid);

  useEffect(() => {
    if (!canWatchPlans || !user?.uid) {
      return undefined;
    }

    const unsubscribe = planService.watchUserPlans(user.uid, (items) => {
      setPlans(items);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [canWatchPlans, user?.uid]);

  return {
    plans: canWatchPlans ? plans : [],
    isLoading: canWatchPlans ? isLoading : false,
  };
}
