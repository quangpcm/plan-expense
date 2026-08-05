'use client';

import { useEffect, useState } from 'react';

import { invitationService } from '@/modules/invitation/services';
import type { InvitationDocument } from '@/modules/invitation/types/invitation';

export function usePlanInvitations(planId: string) {
  const [invitations, setInvitations] = useState<InvitationDocument[]>([]);

  useEffect(() => {
    if (!planId) {
      return undefined;
    }

    const unsubscribe = invitationService.watchInvitations(planId, setInvitations);

    return () => {
      unsubscribe();
    };
  }, [planId]);

  return {
    invitations,
  };
}

