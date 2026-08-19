import type { Timestamp } from 'firebase/firestore';

export type DebtStatus = 'active' | 'paid';

export type DebtDocument = {
  id: string;
  planId: string;
  title: string;
  borrowerMemberId: string | null;
  lenderMemberId: string | null;
  principalAmount: number;
  note: string | null;
  dueDate: Timestamp | null;
  status: DebtStatus;
  createdByUserId: string;
  createdByMemberId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  closedAt: Timestamp | null;
};

export type RepaymentDocument = {
  id: string;
  planId: string;
  debtId: string;
  amount: number;
  note: string | null;
  paidAt: Timestamp;
  createdByUserId: string;
  createdByMemberId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateDebtInput = {
  title: string;
  borrowerMemberId?: string | undefined;
  lenderMemberId?: string | undefined;
  principalAmount: number;
  note?: string | undefined;
  dueDate?: string | undefined;
};

export type RecordRepaymentInput = {
  debtId: string;
  amount: number;
  note?: string | undefined;
  paidAt: string;
};

export type DebtTrackingSummary = {
  totalPrincipalAmount: number;
  totalRepaidAmount: number;
  outstandingAmount: number;
  activeDebtCount: number;
  paidDebtCount: number;
  repaymentCount: number;
};
