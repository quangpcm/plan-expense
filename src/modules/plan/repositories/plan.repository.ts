import type { CategoryPreset } from '@/modules/category/types/category';
import type { AuthUser } from '@/modules/auth/types/auth';
import type { PlanDocument, PlanSummary } from '@/modules/plan/types/plan';

export type CreatePlanPersistenceInput = {
  name: string;
  description: string | null;
  planType: PlanDocument['planType'];
  startDate: Date | null;
  endDate: Date | null;
  owner: AuthUser;
  timezone: string;
  categoryPresets: CategoryPreset[];
};

export interface PlanRepository {
  createPlanGraph(input: CreatePlanPersistenceInput): Promise<{ planId: string }>;
  closePlan(planId: string): Promise<void>;
  watchUserPlans(userId: string, callback: (plans: PlanSummary[]) => void): () => void;
  watchPlan(planId: string, callback: (plan: PlanDocument | null) => void): () => void;
}
