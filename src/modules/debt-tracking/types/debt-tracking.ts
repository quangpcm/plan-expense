import type { Timestamp } from 'firebase/firestore';

export type DebtTransactionKind = 'expense' | 'income';

export type MemberDebtTransaction = {
  transactionId: string;
  memberId: string;
  kind: DebtTransactionKind;
  amount: number;
  occurredAt: Timestamp;
  title: string;
  note: string | null;
};

export type MemberDebtSnapshot = {
  memberId: string;
  totalLentAmount: number;
  totalRepaidAmount: number;
  outstandingAmount: number;
  transactionCount: number;
  lastTransactionAt: Timestamp | null;
  lastExpenseAt: Timestamp | null;
  lastIncomeAt: Timestamp | null;
};

export type MemberDebtAggregate = {
  snapshot: MemberDebtSnapshot;
  transactions: MemberDebtTransaction[];
};

export type DebtTrackingSummary = {
  totalLentAmount: number;
  totalRepaidAmount: number;
  outstandingAmount: number;
  counterpartCount: number;
  activeCounterpartCount: number;
  settledCounterpartCount: number;
  transactionCount: number;
  lentOutstandingAmount: number;
  borrowedOutstandingAmount: number;
};
