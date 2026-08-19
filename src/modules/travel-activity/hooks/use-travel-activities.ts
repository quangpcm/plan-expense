'use client';

import { useEffect, useState } from 'react';

import { travelActivityService } from '@/modules/travel-activity/services';
import type { TravelActivityDocument } from '@/modules/travel-activity/types/travel-activity';

export function useTravelActivities(planId: string, enabled = true) {
  const [activities, setActivities] = useState<TravelActivityDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isActive = Boolean(planId && enabled);

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    const unsubscribe = travelActivityService.watchActivities(
      planId,
      (nextActivities) => {
        setActivities(nextActivities);
        setIsLoading(false);
        setErrorMessage(null);
      },
      (error) => {
        setActivities([]);
        setIsLoading(false);
        setErrorMessage(error.message);
      },
    );

    return () => unsubscribe();
  }, [isActive, planId]);

  return {
    activities: isActive ? activities : [],
    isLoading: isActive ? isLoading : false,
    errorMessage: isActive ? errorMessage : null,
  };
}
