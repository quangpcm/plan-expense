'use client';

import { useEffect, useState } from 'react';

import { weddingGuestGroupService } from '@/modules/wedding-guest/services';
import type { WeddingGuestGroupDocument } from '@/modules/wedding-guest/types/wedding-guest-group';

export function useWeddingGuestGroups(planId: string) {
  const [groups, setGroups] = useState<WeddingGuestGroupDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) {
      return undefined;
    }

    const unsubscribe = weddingGuestGroupService.watchGroups(
      planId,
      (nextGroups) => {
        setGroups(nextGroups);
        setIsLoading(false);
        setErrorMessage(null);
      },
      (error) => {
        setGroups([]);
        setIsLoading(false);
        setErrorMessage(error.message);
      },
    );

    return () => unsubscribe();
  }, [planId]);

  return { groups, isLoading, errorMessage };
}
