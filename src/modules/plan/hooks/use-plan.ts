'use client';

import { useEffect, useState } from 'react';

import { planService } from '@/modules/plan/services';
import type { PlanDocument } from '@/modules/plan/types/plan';

export function usePlan(planId: string) {
  const [plan, setPlan] = useState<PlanDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canWatchPlan = Boolean(planId);

  useEffect(() => {
    if (!canWatchPlan) {
      return undefined;
    }

    const unsubscribe = planService.watchPlan(
      planId,
      (nextPlan) => {
        setPlan(nextPlan);
        setErrorMessage(null);
        setIsLoading(false);
      },
      (error) => {
        setPlan(null);
        setErrorMessage(error.message);
        setIsLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [canWatchPlan, planId]);

  return {
    plan: canWatchPlan ? plan : null,
    isLoading: canWatchPlan ? isLoading : false,
    errorMessage,
  };
}
