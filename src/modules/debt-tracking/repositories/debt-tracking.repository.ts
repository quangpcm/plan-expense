import type {
  CreateDebtInput,
  DebtDocument,
  RecordRepaymentInput,
  RepaymentDocument,
} from '@/modules/debt-tracking/types/debt-tracking';

export type CreateDebtPersistenceInput = CreateDebtInput & {
  planId: string;
  debtId: string;
  createdByUserId: string;
  createdByMemberId: string;
};

export type RecordRepaymentPersistenceInput = RecordRepaymentInput & {
  planId: string;
  repaymentId: string;
  createdByUserId: string;
  createdByMemberId: string;
};

export interface DebtTrackingRepository {
  generateDebtId(planId: string): string;
  generateRepaymentId(planId: string): string;
  createDebt(input: CreateDebtPersistenceInput): Promise<{ debtId: string }>;
  recordRepayment(input: RecordRepaymentPersistenceInput): Promise<{ repaymentId: string }>;
  watchDebts(
    planId: string,
    callback: (debts: DebtDocument[]) => void,
    onError?: (error: Error) => void,
  ): () => void;
  watchRepayments(
    planId: string,
    callback: (repayments: RepaymentDocument[]) => void,
    onError?: (error: Error) => void,
  ): () => void;
}
