import type { AuthUser } from '@/modules/auth/types/auth';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { IncomeDocument } from '@/modules/income/types/income';

export type CreateIncomePersistenceInput = {
  planId: string;
  title: string;
  categoryId: string | null;
  amount: number;
  contributedByMemberId: string;
  note: string | null;
  receivedAt: Date;
  createdByUser: AuthUser;
  createdByMember: PlanMemberDocument;
};

export interface IncomeRepository {
  createIncome(input: CreateIncomePersistenceInput): Promise<{ incomeId: string }>;
  watchIncomes(planId: string, callback: (incomes: IncomeDocument[]) => void): () => void;
}

