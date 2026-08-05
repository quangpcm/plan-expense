'use client';

import { useEffect, useState } from 'react';

import { incomeService } from '@/modules/income/services';
import type { IncomeDocument } from '@/modules/income/types/income';

export function useIncomes(planId: string) {
  const [incomes, setIncomes] = useState<IncomeDocument[]>([]);

  useEffect(() => {
    if (!planId) {
      return undefined;
    }

    return incomeService.watchIncomes(planId, setIncomes);
  }, [planId]);

  return {
    incomes,
  };
}

