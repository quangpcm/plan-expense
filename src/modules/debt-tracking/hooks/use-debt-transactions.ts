'use client';

import { useEffect, useState } from 'react';

import { debtTransactionService } from '@/modules/debt-tracking/services';
import type { DebtTransaction } from '@/modules/debt-tracking/types/debt-transaction';

export function useDebtTransactions(planId: string, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [transactions, setTransactions] = useState<DebtTransaction[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isActive = Boolean(planId && enabled);

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    return debtTransactionService.watchDebtTransactions(
      planId,
      (items) => {
        setTransactions(items);
        setErrorMessage(null);
        setIsLoading(false);
      },
      (error) => {
        setTransactions([]);
        setErrorMessage(error.message);
        setIsLoading(false);
      },
    );
  }, [isActive, planId]);

  return {
    transactions: isActive ? transactions : [],
    errorMessage: isActive ? errorMessage : null,
    isLoading: isActive ? isLoading : false,
  };
}
