'use client';

import { useEffect, useState } from 'react';

import { incomeService } from '@/modules/income/services';
import type { IncomeDocument } from '@/modules/income/types/income';

export function useIncome(planId: string, incomeId: string) {
  const [income, setIncome] = useState<IncomeDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!planId || !incomeId) {
      return undefined;
    }

    return incomeService.watchIncome(
      planId,
      incomeId,
      (nextIncome) => {
        setIncome(nextIncome);
        setErrorMessage(null);
        setIsLoading(false);
      },
      (error) => {
        setIncome(null);
        setErrorMessage(error.message);
        setIsLoading(false);
      },
    );
  }, [incomeId, planId]);

  return {
    income,
    isLoading,
    errorMessage,
  };
}
