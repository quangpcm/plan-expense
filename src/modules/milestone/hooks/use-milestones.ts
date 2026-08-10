'use client';

import { useEffect, useState } from 'react';

import { milestoneService } from '@/modules/milestone/services';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';

export function useMilestones(planId: string) {
  const [milestones, setMilestones] = useState<MilestoneDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) {
      return undefined;
    }

    const unsubscribe = milestoneService.watchMilestones(
      planId,
      (nextMilestones) => {
        setMilestones(nextMilestones);
        setIsLoading(false);
        setErrorMessage(null);
      },
      (error) => {
        setMilestones([]);
        setIsLoading(false);
        setErrorMessage(error.message);
      },
    );

    return () => unsubscribe();
  }, [planId]);

  return {
    milestones,
    isLoading,
    errorMessage,
  };
}
