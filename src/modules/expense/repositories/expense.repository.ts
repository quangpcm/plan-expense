import type { AuthUser } from '@/modules/auth/types/auth';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MediaAttachment } from '@/modules/storage/types/attachment';
import type {
  ExpenseDocument,
  ExpenseParticipant,
  SplitMethod,
  UpdateExpenseInput,
} from '@/modules/expense/types/expense';

export type CreateExpensePersistenceInput = {
  planId: string;
  expenseId: string;
  milestoneId: string;
  title: string;
  categoryId: string | null;
  amount: number;
  paidByMemberId: string;
  participants: ExpenseParticipant[];
  splitMethod: SplitMethod;
  merchantName: string | null;
  locationName: string | null;
  note: string | null;
  spentAt: Date;
  createdByUser: AuthUser;
  createdByMember: PlanMemberDocument;
  attachments: ExpenseDocument['attachments'];
};

export type UpdateExpensePersistenceInput = Omit<UpdateExpenseInput, 'attachments'> & {
  attachments: ExpenseDocument['attachments'];
};

export interface ExpenseRepository {
  generateExpenseId(planId: string): string;
  createExpense(input: CreateExpensePersistenceInput): Promise<{ expenseId: string }>;
  updateExpense(
    planId: string,
    input: UpdateExpensePersistenceInput,
    participants: ExpenseParticipant[],
  ): Promise<{ orphanedAttachments: MediaAttachment[] }>;
  deleteExpense(planId: string, expenseId: string, actor: AuthUser): Promise<{ orphanedAttachments: MediaAttachment[] }>;
  watchExpenses(
    planId: string,
    callback: (expenses: ExpenseDocument[]) => void,
    onError?: (error: Error) => void,
  ): () => void;
  watchExpense(
    planId: string,
    expenseId: string,
    callback: (expense: ExpenseDocument | null) => void,
    onError?: (error: Error) => void,
  ): () => void;
}
