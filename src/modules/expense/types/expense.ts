import type { Timestamp } from 'firebase/firestore';

import type { AttachmentDraft, MediaAttachment } from '@/modules/storage/types/attachment';
import type { CurrencyCode } from '@/modules/plan/types/plan';

export type SplitMethod = 'self' | 'equal' | 'exact' | 'percentage' | 'shares';

export type ExpenseStatus = 'active' | 'deleted';

export type ExpensePaymentSourceType = 'member' | 'fund';

export type ExpenseAttachment = MediaAttachment;

export type ExpenseParticipant = {
  memberId: string;
  amount: number;
  percentage: number | null;
  shares: number | null;
};

export type ExpenseDocument = {
  id: string;
  planId: string;
  milestoneId: string;
  activityId?: string | null;
  title: string;
  categoryId: string | null;
  amount: number;
  currency: CurrencyCode;
  paymentSourceType: ExpensePaymentSourceType;
  /**
   * Required when paymentSourceType === 'member'. Null when paymentSourceType === 'fund'.
   */
  paidByMemberId: string | null;
  participants: ExpenseParticipant[];
  splitMethod: SplitMethod;
  merchantName: string | null;
  locationName: string | null;
  note: string | null;
  attachments: ExpenseAttachment[];
  spentAt: Timestamp;
  createdByUserId: string;
  createdByMemberId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: ExpenseStatus;
  deletedAt: Timestamp | null;
  deletedByUserId: string | null;
  version: number;
};

export type CreateExpenseInput = {
  title: string;
  amount: number;
  milestoneId: string;
  activityId?: string | undefined;
  categoryId?: string | undefined;
  paymentSourceType: ExpensePaymentSourceType;
  paidByMemberId: string | null;
  participantMemberIds: string[];
  splitMethod: SplitMethod;
  splitValues?: Record<string, number> | undefined;
  merchantName?: string | undefined;
  locationName?: string | undefined;
  note?: string | undefined;
  spentAt?: string | undefined;
  attachments: AttachmentDraft[];
};

export type UpdateExpenseInput = {
  expenseId: string;
  title: string;
  amount: number;
  milestoneId: string;
  activityId?: string | undefined;
  categoryId?: string | undefined;
  paymentSourceType: ExpensePaymentSourceType;
  paidByMemberId: string | null;
  participantMemberIds: string[];
  splitMethod: SplitMethod;
  splitValues?: Record<string, number> | undefined;
  merchantName?: string | undefined;
  locationName?: string | undefined;
  note?: string | undefined;
  spentAt?: string | undefined;
  attachments: AttachmentDraft[];
};
