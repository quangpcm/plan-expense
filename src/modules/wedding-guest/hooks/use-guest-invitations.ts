'use client';

import { useEffect, useState } from 'react';

import { guestInvitationService } from '@/modules/wedding-guest/services';
import type { GuestInvitationDocument } from '@/modules/wedding-guest/types/guest-invitation';

export function useGuestInvitations(planId: string) {
  const [invitations, setInvitations] = useState<GuestInvitationDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) {
      return undefined;
    }

    const unsubscribe = guestInvitationService.watchInvitations(
      planId,
      (nextInvitations) => {
        setInvitations(nextInvitations);
        setIsLoading(false);
        setErrorMessage(null);
      },
      (error) => {
        setInvitations([]);
        setIsLoading(false);
        setErrorMessage(error.message);
      },
    );

    return () => unsubscribe();
  }, [planId]);

  return { invitations, isLoading, errorMessage };
}
