'use client';

import { useEffect, useState } from 'react';

import { expenseService } from '@/modules/expense/services';
import type { ExpenseDocument } from '@/modules/expense/types/expense';

export function useExpense(planId: string, expenseId: string) {
  const [expense, setExpense] = useState<ExpenseDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!planId || !expenseId) {
      return undefined;
    }

    return expenseService.watchExpense(
      planId,
      expenseId,
      (nextExpense) => {
        setExpense(nextExpense);
        setErrorMessage(null);
        setIsLoading(false);
      },
      (error) => {
        setExpense(null);
        setErrorMessage(error.message);
        setIsLoading(false);
      },
    );
  }, [expenseId, planId]);

  return {
    expense,
    isLoading,
    errorMessage,
  };
}
