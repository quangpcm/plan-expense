import type { AuthUser } from '@/modules/auth/types/auth';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { IncomeDocument, UpdateIncomeInput } from '@/modules/income/types/income';

export type CreateIncomePersistenceInput = {
  planId: string;
  milestoneId: string;
  title: string;
  categoryId: string | null;
  amount: number;
  contributedByMemberId: string;
  allocatedToMemberId: string | null;
  note: string | null;
  receivedAt: Date;
  createdByUser: AuthUser;
  createdByMember: PlanMemberDocument;
};

export interface IncomeRepository {
  createIncome(input: CreateIncomePersistenceInput): Promise<{ incomeId: string }>;
  updateIncome(planId: string, input: UpdateIncomeInput): Promise<void>;
  softDeleteIncome(planId: string, incomeId: string, actor: AuthUser): Promise<void>;
  watchIncomes(
    planId: string,
    callback: (incomes: IncomeDocument[]) => void,
    onError?: (error: Error) => void,
  ): () => void;
  watchIncome(
    planId: string,
    incomeId: string,
    callback: (income: IncomeDocument | null) => void,
    onError?: (error: Error) => void,
  ): () => void;
}
