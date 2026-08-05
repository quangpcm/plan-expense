'use client';

import { useEffect, useState } from 'react';

import { expenseService } from '@/modules/expense/services';
import type { ExpenseDocument } from '@/modules/expense/types/expense';

export function useExpenses(planId: string) {
  const [expenses, setExpenses] = useState<ExpenseDocument[]>([]);

  useEffect(() => {
    if (!planId) {
      return undefined;
    }

    return expenseService.watchExpenses(planId, setExpenses);
  }, [planId]);

  return {
    expenses,
  };
}

