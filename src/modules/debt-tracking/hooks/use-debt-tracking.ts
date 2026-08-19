'use client';

import { useEffect, useMemo, useState } from 'react';

import { debtTrackingService } from '@/modules/debt-tracking/services';
import type {
  DebtDocument,
  DebtTrackingSummary,
  RepaymentDocument,
} from '@/modules/debt-tracking/types/debt-tracking';

export function useDebtTracking(planId: string, enabled = true) {
  const [debts, setDebts] = useState<DebtDocument[]>([]);
  const [repayments, setRepayments] = useState<RepaymentDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isActive = Boolean(planId && enabled);

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }
    let pendingSubscriptions = 2;

    const markLoaded = () => {
      pendingSubscriptions -= 1;

      if (pendingSubscriptions <= 0) {
        setIsLoading(false);
      }
    };

    const unsubscribeDebts = debtTrackingService.watchDebts(
      planId,
      (items) => {
        setDebts(items);
        setErrorMessage(null);
        markLoaded();
      },
      (error) => {
        setDebts([]);
        setErrorMessage(error.message);
        markLoaded();
      },
    );

    const unsubscribeRepayments = debtTrackingService.watchRepayments(
      planId,
      (items) => {
        setRepayments(items);
        setErrorMessage(null);
        markLoaded();
      },
      (error) => {
        setRepayments([]);
        setErrorMessage(error.message);
        markLoaded();
      },
    );

    return () => {
      unsubscribeDebts();
      unsubscribeRepayments();
    };
  }, [isActive, planId]);

  const repaymentTotalsByDebtId = useMemo(() => {
    const totals: Record<string, number> = {};

    for (const repayment of repayments) {
      totals[repayment.debtId] = (totals[repayment.debtId] ?? 0) + repayment.amount;
    }

    return totals;
  }, [repayments]);

  const summary = useMemo<DebtTrackingSummary>(() => {
    const totalPrincipalAmount = debts.reduce(
      (total, debt) => total + debt.principalAmount,
      0,
    );
    const totalRepaidAmount = repayments.reduce(
      (total, repayment) => total + repayment.amount,
      0,
    );
    const outstandingAmount = debts.reduce((total, debt) => {
      const repaidAmount = repaymentTotalsByDebtId[debt.id] ?? 0;
      return total + Math.max(debt.principalAmount - repaidAmount, 0);
    }, 0);
    const activeDebtCount = debts.filter((debt) => debt.status === 'active').length;
    const paidDebtCount = debts.filter((debt) => debt.status === 'paid').length;

    return {
      totalPrincipalAmount,
      totalRepaidAmount,
      outstandingAmount,
      activeDebtCount,
      paidDebtCount,
      repaymentCount: repayments.length,
    };
  }, [debts, repaymentTotalsByDebtId, repayments]);

  return {
    debts: isActive ? debts : [],
    repayments: isActive ? repayments : [],
    repaymentTotalsByDebtId: isActive ? repaymentTotalsByDebtId : {},
    summary: isActive
      ? summary
      : {
          totalPrincipalAmount: 0,
          totalRepaidAmount: 0,
          outstandingAmount: 0,
          activeDebtCount: 0,
          paidDebtCount: 0,
          repaymentCount: 0,
        },
    isLoading: isActive ? isLoading : false,
    errorMessage: isActive ? errorMessage : null,
  };
}
