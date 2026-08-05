'use client';

import { useState } from 'react';

import { planService } from '@/modules/plan/services';
import type { CreatePlanInput } from '@/modules/plan/types/plan';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';

export function useCreatePlan() {
  const { user } = useAuthSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function createPlan(input: CreatePlanInput) {
    if (!user) {
      throw new Error('You must be logged in to create a plan.');
    }

    setIsSubmitting(true);

    try {
      return await planService.createPlan(input, user);
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    createPlan,
    isSubmitting,
  };
}

