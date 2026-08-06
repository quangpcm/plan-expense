'use client';

import { useState } from 'react';

import { planService } from '@/modules/plan/services';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument, UpdatePlanInput } from '@/modules/plan/types/plan';

export function useUpdatePlan() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function updatePlan(
    plan: PlanDocument,
    input: UpdatePlanInput,
    currentMember: PlanMemberDocument | null,
  ) {
    setIsSubmitting(true);

    try {
      await planService.updatePlan(plan, input, currentMember);
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    updatePlan,
    isSubmitting,
  };
}
