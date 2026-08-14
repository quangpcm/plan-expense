import type { AuthUser } from '@/modules/auth/types/auth';
import type { PlanDocument, PlanSummary } from '@/modules/plan/types/plan';

export type CreatePlanPersistenceInput = {
  name: string;
  description: string | null;
  planType: PlanDocument['planType'];
  startDate: Date | null;
  endDate: Date | null;
  budgetAmount: number | null;
  savingGoalAmount: number | null;
  savingTargetDate: Date | null;
  owner: AuthUser;
  timezone: string;
};

export type UpdatePlanPersistenceInput = {
  name: string;
  description: string | null;
  planType: PlanDocument['planType'];
  status: PlanDocument['status'];
  startDate: Date | null;
  endDate: Date | null;
  budgetAmount: number | null;
  savingGoalAmount: number | null;
  savingTargetDate: Date | null;
  closedAt: Date | null;
  archivedAt: Date | null;
};

export interface PlanRepository {
  createPlanGraph(input: CreatePlanPersistenceInput): Promise<{ planId: string }>;
  updatePlan(planId: string, input: UpdatePlanPersistenceInput): Promise<void>;
  completePlan(planId: string): Promise<void>;
  closePlan(planId: string): Promise<void>;
  setPlanSecurityForUser(userId: string, planId: string, isLocked: boolean): Promise<void>;
  clearAllPlanSecurityForUser(userId: string): Promise<void>;
  deletePlan(planId: string, ownerUserId: string): Promise<void>;
  watchUserPlans(
    userId: string,
    callback: (plans: PlanSummary[]) => void,
    onError?: (error: Error) => void,
  ): () => void;
  watchPlan(
    planId: string,
    callback: (plan: PlanDocument | null) => void,
    onError?: (error: Error) => void,
  ): () => void;
}
