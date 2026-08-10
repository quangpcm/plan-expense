import type { Timestamp } from 'firebase/firestore';

import type { CurrencyCode } from '@/modules/plan/types/plan';
import type { ExpenseAttachment } from '@/modules/expense/types/expense';

export type IncomeStatus = 'active' | 'deleted';

export type IncomeDocument = {
  id: string;
  planId: string;
  title: string;
  categoryId: string | null;
  amount: number;
  currency: CurrencyCode;
  contributedByMemberId: string;
  note: string | null;
  attachments: ExpenseAttachment[];
  receivedAt: Timestamp;
  createdByUserId: string;
  createdByMemberId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: IncomeStatus;
  deletedAt: Timestamp | null;
  deletedByUserId: string | null;
  version: number;
};

export type CreateIncomeInput = {
  title: string;
  amount: number;
  categoryId?: string | undefined;
  contributedByMemberId: string;
  note?: string | undefined;
  receivedAt?: string | undefined;
};

export type UpdateIncomeInput = {
  incomeId: string;
  title: string;
  amount: number;
  categoryId?: string | undefined;
  contributedByMemberId: string;
  note?: string | undefined;
  receivedAt?: string | undefined;
};

