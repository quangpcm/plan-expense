import type { Timestamp } from 'firebase/firestore';

import type {
  DebtDirection,
  DebtTransaction,
} from '@/modules/debt-tracking/types/debt-transaction';

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

function maxTimestamp(
  left: Timestamp | null,
  right: Timestamp | null,
): Timestamp | null {
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
  const loan = sumByDirectionAndType(
    transactions,
    direction,
    'loan',
    excludeTransactionId,
  );
  const repayment = sumByDirectionAndType(
    transactions,
    direction,
    'repayment',
    excludeTransactionId,
  );

  return loan - repayment;
}

export function calculateCounterpartyLedger(
  counterpartyMemberId: string,
  transactions: DebtTransaction[],
): CounterpartyDebtLedger {
  const receivableLoan = sumByDirectionAndType(
    transactions,
    'receivable',
    'loan',
  );
  const receivableRepayment = sumByDirectionAndType(
    transactions,
    'receivable',
    'repayment',
  );
  const payableLoan = sumByDirectionAndType(transactions, 'payable', 'loan');
  const payableRepayment = sumByDirectionAndType(
    transactions,
    'payable',
    'repayment',
  );
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

export function calculateAllCounterpartyLedgers(
  transactions: DebtTransaction[],
): CounterpartyDebtLedger[] {
  const grouped = groupTransactionsByCounterparty(transactions);

  return Array.from(grouped.entries())
    .map(([counterpartyMemberId, counterpartyTransactions]) =>
      calculateCounterpartyLedger(
        counterpartyMemberId,
        counterpartyTransactions,
      ),
    )
    .sort(
      (left, right) =>
        (right.lastTransactionAt?.toMillis() ?? 0) -
        (left.lastTransactionAt?.toMillis() ?? 0),
    );
}

export function calculatePlanDebtSummary(
  transactions: DebtTransaction[],
): PlanDebtSummary {
  const ledgers = calculateAllCounterpartyLedgers(transactions);

  const totalReceivableLoan = ledgers.reduce(
    (total, ledger) => total + ledger.receivableLoan,
    0,
  );
  const totalReceivableRepaid = ledgers.reduce(
    (total, ledger) => total + ledger.receivableRepayment,
    0,
  );
  const totalPayableLoan = ledgers.reduce(
    (total, ledger) => total + ledger.payableLoan,
    0,
  );
  const totalPayableRepaid = ledgers.reduce(
    (total, ledger) => total + ledger.payableRepayment,
    0,
  );
  const totalReceivableOutstanding =
    totalReceivableLoan - totalReceivableRepaid;
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
      (ledger) =>
        ledger.receivableOutstanding > 0 || ledger.payableOutstanding > 0,
    ).length,
  };
}

// Cash-in nghĩa là tiền chảy VÀO túi mình: vay tiền (payable) hoặc được trả nợ (receivable
// repayment). Cash-out là chiều ngược lại. Quy ước này phụ thuộc CẢ type lẫn direction —
// không được chỉ dựa vào type (docs/debt-plan-specs.md thread: "amount sign/color cần được
// xác định từ debt direction, không đơn thuần từ loan/repayment"). Single source of truth
// để UI (danh sách giao dịch theo người, hoạt động gần đây...) không lệch quy ước nhau.
export function isDebtTransactionCashIn(
  transaction: Pick<DebtTransaction, 'type' | 'direction'>,
): boolean {
  const isLoan = transaction.type === 'loan';
  const isReceivable = transaction.direction === 'receivable';

  return (isLoan && !isReceivable) || (!isLoan && isReceivable);
}

export type DebtAttentionItem = {
  counterpartyMemberId: string;
  direction: DebtDirection;
  outstanding: number;
  earliestDueDate: Timestamp;
  isOverdue: boolean;
};

// "Cần chú ý": loan có dueDate đã quá hạn hoặc sắp đến hạn (trong `upcomingWindowDays`),
// nhóm theo counterparty+direction, chỉ lấy mốc due gần nhất mỗi nhóm. Amount hiển thị là
// outstanding CỦA CẢ LEDGER (direction đó), không phải amount riêng của loan — vì repayment
// không allocate vào một loan cụ thể nên không được khẳng định loan đó còn lại bao nhiêu
// (docs/debt-plan-specs.md #21/#22). Bỏ qua nhóm đã hết outstanding (đã trả xong).
export function calculateDebtAttentionItems(
  transactions: DebtTransaction[],
  ledgers: CounterpartyDebtLedger[],
  now: Date,
  upcomingWindowDays = 7,
): DebtAttentionItem[] {
  const windowEndMs = now.getTime() + upcomingWindowDays * 24 * 60 * 60 * 1000;
  const ledgerByCounterpartyId = new Map(
    ledgers.map((ledger) => [ledger.counterpartyMemberId, ledger]),
  );
  const earliestDueByKey = new Map<string, Timestamp>();

  for (const transaction of transactions) {
    if (transaction.type !== 'loan' || !transaction.dueDate) {
      continue;
    }

    if (transaction.dueDate.toMillis() > windowEndMs) {
      continue;
    }

    const key = `${transaction.counterpartyMemberId}:${transaction.direction}`;
    const existing = earliestDueByKey.get(key);

    if (!existing || transaction.dueDate.toMillis() < existing.toMillis()) {
      earliestDueByKey.set(key, transaction.dueDate);
    }
  }

  const items: DebtAttentionItem[] = [];

  for (const [key, earliestDueDate] of earliestDueByKey.entries()) {
    const [counterpartyMemberId, direction] = key.split(':') as [
      string,
      DebtDirection,
    ];
    const ledger = ledgerByCounterpartyId.get(counterpartyMemberId);
    const outstanding = ledger
      ? direction === 'receivable'
        ? ledger.receivableOutstanding
        : ledger.payableOutstanding
      : 0;

    if (outstanding <= 0) {
      continue;
    }

    items.push({
      counterpartyMemberId,
      direction,
      outstanding,
      earliestDueDate,
      isOverdue: earliestDueDate.toMillis() < now.getTime(),
    });
  }

  return items.sort((left, right) => {
    if (left.isOverdue !== right.isOverdue) {
      return left.isOverdue ? -1 : 1;
    }

    return left.earliestDueDate.toMillis() - right.earliestDueDate.toMillis();
  });
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
  const outstanding = calculateOutstanding(
    counterpartyTransactions,
    direction,
    excludeTransactionId,
  );

  return {
    valid: amount > 0 && amount <= outstanding,
    outstanding,
  };
}
