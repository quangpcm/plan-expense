'use client';

import { useEffect, useState } from 'react';

import { incomeService } from '@/modules/income/services';
import type { IncomeDocument } from '@/modules/income/types/income';

export function useIncomes(planId: string) {
  const [incomes, setIncomes] = useState<IncomeDocument[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) {
      return undefined;
    }

    return incomeService.watchIncomes(
      planId,
      (items) => {
        setIncomes(items);
        setErrorMessage(null);
      },
      (error) => {
        setIncomes([]);
        setErrorMessage(error.message);
      },
    );
  }, [planId]);

  return {
    incomes,
    errorMessage,
  };
}
