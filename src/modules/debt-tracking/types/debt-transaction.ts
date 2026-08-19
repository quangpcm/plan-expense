import type { Timestamp } from 'firebase/firestore';

import type { AttachmentDraft, MediaAttachment } from '@/modules/storage/types/attachment';

export type DebtDirection = 'receivable' | 'payable';
export type DebtTransactionType = 'loan' | 'repayment';

export type DebtTransaction = {
  id: string;
  planId: string;
  counterpartyMemberId: string;
  direction: DebtDirection;
  type: DebtTransactionType;
  amount: number;
  occurredAt: Timestamp;
  dueDate: Timestamp | null;
  note: string | null;
  attachments: MediaAttachment[];
  createdByUserId: string;
  createdByMemberId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateDebtTransactionInput = {
  counterpartyMemberId: string;
  direction: DebtDirection;
  type: DebtTransactionType;
  amount: number;
  occurredAt: Date;
  dueDate?: Date | null | undefined;
  note?: string | null | undefined;
  attachments: AttachmentDraft[];
};

export type UpdateDebtTransactionInput = {
  transactionId: string;
  amount: number;
  occurredAt: Date;
  dueDate?: Date | null | undefined;
  note?: string | null | undefined;
  attachments: AttachmentDraft[];
};
