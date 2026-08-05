import type { Timestamp } from 'firebase/firestore';

import type { ExpenseAttachment } from '@/modules/expense/types/expense';
import type { CurrencyCode } from '@/modules/plan/types/plan';

export type SettlementStatus = 'completed' | 'cancelled';

export type SettlementDocument = {
  id: string;
  planId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  currency: CurrencyCode;
  note: string | null;
  attachments: ExpenseAttachment[];
  settledAt: Timestamp;
  status: SettlementStatus;
  createdByUserId: string;
  createdByMemberId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  cancelledAt: Timestamp | null;
  cancelledByUserId: string | null;
  version: number;
};

export type ConfirmSettlementInput = {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  note?: string | undefined;
};

export type SettlementSuggestion = {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
};
