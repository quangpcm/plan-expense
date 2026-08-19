'use client';

import { useMemo } from 'react';

import {
  calculateAllCounterpartyLedgers,
  calculatePlanDebtSummary,
} from '@/modules/debt-tracking/calculators/debt-calculators';
import type { DebtTransaction } from '@/modules/debt-tracking/types/debt-transaction';

export function useDebtLedger(transactions: DebtTransaction[]) {
  const counterpartyLedgers = useMemo(() => calculateAllCounterpartyLedgers(transactions), [transactions]);
  const planSummary = useMemo(() => calculatePlanDebtSummary(transactions), [transactions]);

  return {
    counterpartyLedgers,
    planSummary,
  };
}
