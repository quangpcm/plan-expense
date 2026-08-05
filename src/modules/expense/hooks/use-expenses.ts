'use client';

import { useEffect, useState } from 'react';

import { expenseService } from '@/modules/expense/services';
import type { ExpenseDocument } from '@/modules/expense/types/expense';

export function useExpenses(planId: string) {
  const [expenses, setExpenses] = useState<ExpenseDocument[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) {
      return undefined;
    }

    return expenseService.watchExpenses(
      planId,
      (items) => {
        setExpenses(items);
        setErrorMessage(null);
      },
      (error) => {
        setExpenses([]);
        setErrorMessage(error.message);
      },
    );
  }, [planId]);

  return {
    expenses,
    errorMessage,
  };
}
