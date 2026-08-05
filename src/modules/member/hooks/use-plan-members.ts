'use client';

import { useEffect, useMemo, useState } from 'react';

import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { memberService } from '@/modules/member/services';
import { resolvePlanPermissions } from '@/modules/member/services/permission.service';
import type { PlanMemberDocument } from '@/modules/member/types/member';

export function usePlanMembers(planId: string) {
  const { user } = useAuthSession();
  const [members, setMembers] = useState<PlanMemberDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!planId) {
      return undefined;
    }

    const unsubscribe = memberService.watchMembers(planId, (items) => {
      setMembers(items);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [planId]);

  const currentMember = useMemo(
    () =>
      members.find((member) => member.userId === user?.uid && member.status !== 'removed') ?? null,
    [members, user?.uid],
  );

  return {
    members,
    isLoading,
    currentMember,
    permissions: resolvePlanPermissions(currentMember),
  };
}

