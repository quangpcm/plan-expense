import type { AuthUser } from '@/modules/auth/types/auth';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MediaAttachment } from '@/modules/storage/types/attachment';
import type { DebtTransactionCategory } from '@/modules/debt-tracking/constants/debt-transaction-category';
import type { DebtDirection, DebtTransaction, DebtTransactionType } from '@/modules/debt-tracking/types/debt-transaction';

export type CreateDebtTransactionPersistenceInput = {
  planId: string;
  transactionId: string;
  counterpartyMemberId: string;
  direction: DebtDirection;
  type: DebtTransactionType;
  title: string;
  category: DebtTransactionCategory;
  amount: number;
  occurredAt: Date;
  dueDate: Date | null;
  note: string | null;
  attachments: MediaAttachment[];
  createdByUser: AuthUser;
  createdByMember: PlanMemberDocument;
};

export type UpdateDebtTransactionPersistenceInput = {
  transactionId: string;
  title: string;
  category: DebtTransactionCategory;
  amount: number;
  occurredAt: Date;
  dueDate: Date | null;
  note: string | null;
  attachments: MediaAttachment[];
};

export interface DebtTransactionRepository {
  generateDebtTransactionId(planId: string): string;
  createDebtTransaction(input: CreateDebtTransactionPersistenceInput): Promise<{ transactionId: string }>;
  updateDebtTransaction(
    planId: string,
    input: UpdateDebtTransactionPersistenceInput,
  ): Promise<{ orphanedAttachments: MediaAttachment[] }>;
  deleteDebtTransaction(
    planId: string,
    transactionId: string,
  ): Promise<{ orphanedAttachments: MediaAttachment[] }>;
  watchDebtTransactions(
    planId: string,
    callback: (transactions: DebtTransaction[]) => void,
    onError?: (error: Error) => void,
  ): () => void;
}
