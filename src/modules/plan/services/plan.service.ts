import { appConfig } from '@/config/app.config';
import type { AuthUser } from '@/modules/auth/types/auth';
import { categoryPresetsByPlanType } from '@/modules/category/constants/category-presets';
import { resolvePlanPermissions } from '@/modules/member/services/permission.service';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanRepository } from '@/modules/plan/repositories/plan.repository';
import type { CreatePlanInput, PlanDocument, PlanSummary } from '@/modules/plan/types/plan';
import { AppError } from '@/shared/errors/app-error';

export class PlanService {
  constructor(private readonly planRepository: PlanRepository) {}

  async createPlan(input: CreatePlanInput, owner: AuthUser) {
    if (!owner.uid) {
      throw new AppError('You need to be authenticated to create a plan.', 'AUTH_REQUIRED', 401);
    }

    const normalizedName = input.name.trim();

    if (!normalizedName) {
      throw new AppError('Plan name is required.', 'PLAN_NAME_REQUIRED', 400);
    }

    const startDate = input.startDate ? new Date(input.startDate) : null;
    const endDate = input.endDate ? new Date(input.endDate) : null;

    return this.planRepository.createPlanGraph({
      name: normalizedName,
      description: input.description?.trim() || null,
      planType: input.planType,
      startDate,
      endDate,
      owner,
      timezone: appConfig.defaultTimezone,
      categoryPresets: categoryPresetsByPlanType[input.planType],
    });
  }

  watchUserPlans(userId: string, callback: (plans: PlanSummary[]) => void, onError?: (error: Error) => void) {
    return this.planRepository.watchUserPlans(userId, callback, onError);
  }

  async closePlan(plan: PlanDocument, currentMember: PlanMemberDocument | null) {
    if (!resolvePlanPermissions(currentMember).canManagePlan) {
      throw new AppError('Only the owner can close this plan.', 'PLAN_CLOSE_PERMISSION_DENIED', 403);
    }

    if (plan.status === 'closed') {
      throw new AppError('This plan is already closed.', 'PLAN_ALREADY_CLOSED', 400);
    }

    await this.planRepository.closePlan(plan.id);
  }

  watchPlan(
    planId: string,
    callback: Parameters<PlanRepository['watchPlan']>[1],
    onError?: (error: Error) => void,
  ) {
    return this.planRepository.watchPlan(planId, callback, onError);
  }
}
