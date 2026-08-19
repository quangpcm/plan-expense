import type { Timestamp } from 'firebase/firestore';

import type { DebtDirection, DebtTransaction } from '@/modules/debt-tracking/types/debt-transaction';

export type CounterpartyDebtLedger = {
  counterpartyMemberId: string;
  receivableLoan: number;
  receivableRepayment: number;
  receivableOutstanding: number;
  payableLoan: number;
  payableRepayment: number;
  payableOutstanding: number;
  netPosition: number;
  lastTransactionAt: Timestamp | null;
  transactionCount: number;
};

export type PlanDebtSummary = {
  totalReceivableLoan: number;
  totalReceivableRepaid: number;
  totalReceivableOutstanding: number;
  totalPayableLoan: number;
  totalPayableRepaid: number;
  totalPayableOutstanding: number;
  netPosition: number;
  counterpartyCount: number;
  activeCounterpartyCount: number;
};

function maxTimestamp(left: Timestamp | null, right: Timestamp | null): Timestamp | null {
  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  return left.toMillis() >= right.toMillis() ? left : right;
}

export function groupTransactionsByCounterparty(
  transactions: DebtTransaction[],
): Map<string, DebtTransaction[]> {
  const grouped = new Map<string, DebtTransaction[]>();

  for (const transaction of transactions) {
    const existing = grouped.get(transaction.counterpartyMemberId);

    if (existing) {
      existing.push(transaction);
    } else {
      grouped.set(transaction.counterpartyMemberId, [transaction]);
    }
  }

  return grouped;
}

function sumByDirectionAndType(
  transactions: DebtTransaction[],
  direction: DebtDirection,
  type: DebtTransaction['type'],
  excludeTransactionId?: string,
): number {
  return transactions.reduce((total, transaction) => {
    if (transaction.direction !== direction || transaction.type !== type) {
      return total;
    }

    if (excludeTransactionId && transaction.id === excludeTransactionId) {
      return total;
    }

    return total + transaction.amount;
  }, 0);
}

export function calculateOutstanding(
  transactions: DebtTransaction[],
  direction: DebtDirection,
  excludeTransactionId?: string,
): number {
  const loan = sumByDirectionAndType(transactions, direction, 'loan', excludeTransactionId);
  const repayment = sumByDirectionAndType(transactions, direction, 'repayment', excludeTransactionId);

  return loan - repayment;
}

export function calculateCounterpartyLedger(
  counterpartyMemberId: string,
  transactions: DebtTransaction[],
): CounterpartyDebtLedger {
  const receivableLoan = sumByDirectionAndType(transactions, 'receivable', 'loan');
  const receivableRepayment = sumByDirectionAndType(transactions, 'receivable', 'repayment');
  const payableLoan = sumByDirectionAndType(transactions, 'payable', 'loan');
  const payableRepayment = sumByDirectionAndType(transactions, 'payable', 'repayment');
  const receivableOutstanding = receivableLoan - receivableRepayment;
  const payableOutstanding = payableLoan - payableRepayment;

  const lastTransactionAt = transactions.reduce<Timestamp | null>(
    (latest, transaction) => maxTimestamp(latest, transaction.occurredAt),
    null,
  );

  return {
    counterpartyMemberId,
    receivableLoan,
    receivableRepayment,
    receivableOutstanding,
    payableLoan,
    payableRepayment,
    payableOutstanding,
    netPosition: receivableOutstanding - payableOutstanding,
    lastTransactionAt,
    transactionCount: transactions.length,
  };
}

export function calculateAllCounterpartyLedgers(transactions: DebtTransaction[]): CounterpartyDebtLedger[] {
  const grouped = groupTransactionsByCounterparty(transactions);

  return Array.from(grouped.entries())
    .map(([counterpartyMemberId, counterpartyTransactions]) =>
      calculateCounterpartyLedger(counterpartyMemberId, counterpartyTransactions),
    )
    .sort((left, right) => (right.lastTransactionAt?.toMillis() ?? 0) - (left.lastTransactionAt?.toMillis() ?? 0));
}

export function calculatePlanDebtSummary(transactions: DebtTransaction[]): PlanDebtSummary {
  const ledgers = calculateAllCounterpartyLedgers(transactions);

  const totalReceivableLoan = ledgers.reduce((total, ledger) => total + ledger.receivableLoan, 0);
  const totalReceivableRepaid = ledgers.reduce((total, ledger) => total + ledger.receivableRepayment, 0);
  const totalPayableLoan = ledgers.reduce((total, ledger) => total + ledger.payableLoan, 0);
  const totalPayableRepaid = ledgers.reduce((total, ledger) => total + ledger.payableRepayment, 0);
  const totalReceivableOutstanding = totalReceivableLoan - totalReceivableRepaid;
  const totalPayableOutstanding = totalPayableLoan - totalPayableRepaid;

  return {
    totalReceivableLoan,
    totalReceivableRepaid,
    totalReceivableOutstanding,
    totalPayableLoan,
    totalPayableRepaid,
    totalPayableOutstanding,
    netPosition: totalReceivableOutstanding - totalPayableOutstanding,
    counterpartyCount: ledgers.length,
    activeCounterpartyCount: ledgers.filter(
      (ledger) => ledger.receivableOutstanding > 0 || ledger.payableOutstanding > 0,
    ).length,
  };
}

export type RepaymentValidationResult = {
  valid: boolean;
  outstanding: number;
};

// docs/debt-plan-specs.md #20: repaymentAmount <= currentOutstanding trong cùng ledger
// (excludeTransactionId dùng khi validate lại một repayment đang được sửa, để không
// tự trừ chính nó vào outstanding).
export function validateRepaymentAmount(
  transactions: DebtTransaction[],
  counterpartyMemberId: string,
  direction: DebtDirection,
  amount: number,
  excludeTransactionId?: string,
): RepaymentValidationResult {
  const counterpartyTransactions = transactions.filter(
    (transaction) => transaction.counterpartyMemberId === counterpartyMemberId,
  );
  const outstanding = calculateOutstanding(counterpartyTransactions, direction, excludeTransactionId);

  return {
    valid: amount > 0 && amount <= outstanding,
    outstanding,
  };
}
