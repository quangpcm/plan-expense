'use client';

import { useEffect, useState } from 'react';

import { invitationService } from '@/modules/invitation/services';
import type { InvitationDocument } from '@/modules/invitation/types/invitation';

export function usePlanInvitations(planId: string) {
  const [invitations, setInvitations] = useState<InvitationDocument[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) {
      return undefined;
    }

    const unsubscribe = invitationService.watchInvitations(
      planId,
      (items) => {
        setInvitations(items);
        setErrorMessage(null);
      },
      (error) => {
        setInvitations([]);
        setErrorMessage(error.message);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [planId]);

  return {
    invitations,
    errorMessage,
  };
}
