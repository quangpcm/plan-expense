'use client';

import { useEffect, useState } from 'react';

import { weddingGuestService } from '@/modules/wedding-guest/services';
import type { WeddingGuestDocument } from '@/modules/wedding-guest/types/wedding-guest';

export function useWeddingGuests(planId: string) {
  const [guests, setGuests] = useState<WeddingGuestDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) {
      return undefined;
    }

    const unsubscribe = weddingGuestService.watchGuests(
      planId,
      (nextGuests) => {
        setGuests(nextGuests);
        setIsLoading(false);
        setErrorMessage(null);
      },
      (error) => {
        setGuests([]);
        setIsLoading(false);
        setErrorMessage(error.message);
      },
    );

    return () => unsubscribe();
  }, [planId]);

  return { guests, isLoading, errorMessage };
}
