'use client';

import { useEffect, useRef, useState } from 'react';

import { planService } from '@/modules/plan/services';
import type { PlanSummary } from '@/modules/plan/types/plan';
import { isArchiveExpired } from '@/modules/plan/utils/plan-archive';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';

export function useArchivedPlans() {
  const { user, isAuthenticated } = useAuthSession();
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canWatchPlans = isAuthenticated && Boolean(user?.uid);
  const purgingPlanIdsRef = useRef(new Set<string>());
  const backfillingPlanIdsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!canWatchPlans || !user?.uid) {
      return undefined;
    }

    const userId = user.uid;

    const unsubscribe = planService.watchArchivedUserPlans(
      userId,
      (items) => {
        const expired = items.filter(
          (item) => item.role === 'owner' && isArchiveExpired(item.archivedAt) && !purgingPlanIdsRef.current.has(item.planId),
        );

        expired.forEach((item) => {
          purgingPlanIdsRef.current.add(item.planId);

          planService.hardDeleteArchivedPlan(userId, item).catch(() => {
            purgingPlanIdsRef.current.delete(item.planId);
          });
        });

        // Legacy/hand-edited mirror docs can be missing archivedAt entirely,
        // which would otherwise mean the retention countdown never starts
        // and the plan never gets auto-purged. Stamp it once, best-effort.
        items
          .filter(
            (item) =>
              item.role === 'owner' && !item.archivedAt && !backfillingPlanIdsRef.current.has(item.planId),
          )
          .forEach((item) => {
            backfillingPlanIdsRef.current.add(item.planId);

            planService.backfillArchivedAt(userId, item).catch(() => {
              backfillingPlanIdsRef.current.delete(item.planId);
            });
          });

        const expiredIds = new Set(expired.map((item) => item.planId));

        setPlans(items.filter((item) => !expiredIds.has(item.planId)));
        setErrorMessage(null);
        setIsLoading(false);
      },
      (error) => {
        setPlans([]);
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
