import { appConfig } from '@/config/app.config';
import type { AuthUser } from '@/modules/auth/types/auth';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanRepository } from '@/modules/plan/repositories/plan.repository';
import type { CreatePlanInput, PlanDocument, PlanSummary, UpdatePlanInput } from '@/modules/plan/types/plan';
import { AppError } from '@/shared/errors/app-error';

export class PlanService {
  constructor(private readonly planRepository: PlanRepository) {}

  private isEndedPlan(plan: PlanDocument) {
    return plan.status === 'completed' || plan.status === 'closed';
  }

  private resolveStatusDates(plan: PlanDocument, nextStatus: UpdatePlanInput['status']) {
    const now = new Date();

    return {
      closedAt: nextStatus === 'closed' ? (plan.closedAt ? plan.closedAt.toDate() : now) : null,
      archivedAt: nextStatus === 'archived' ? (plan.archivedAt ? plan.archivedAt.toDate() : now) : null,
    };
  }

  private normalizePlanMetrics(input: Pick<CreatePlanInput, 'budgetAmount' | 'savingGoalAmount' | 'savingTargetDate'>) {
    return {
      budgetAmount: input.budgetAmount && input.budgetAmount > 0 ? input.budgetAmount : null,
      savingGoalAmount: input.savingGoalAmount && input.savingGoalAmount > 0 ? input.savingGoalAmount : null,
      savingTargetDate: input.savingTargetDate ? new Date(input.savingTargetDate) : null,
    };
  }

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
    const { budgetAmount, savingGoalAmount, savingTargetDate } = this.normalizePlanMetrics(input);

    return this.planRepository.createPlanGraph({
      name: normalizedName,
      description: input.description?.trim() || null,
      planType: input.planType,
      debtModel: input.planType === 'debt' ? 'native_debt' : undefined,
      startDate,
      endDate,
      budgetAmount,
      savingGoalAmount,
      savingTargetDate,
      owner,
      timezone: appConfig.defaultTimezone,
    });
  }

  watchUserPlans(userId: string, callback: (plans: PlanSummary[]) => void, onError?: (error: Error) => void) {
    return this.planRepository.watchUserPlans(userId, callback, onError);
  }

  getUserPlans(userId: string) {
    return this.planRepository.getUserPlans(userId);
  }

  async updatePlan(
    plan: PlanDocument,
    input: UpdatePlanInput,
    currentMember: PlanMemberDocument | null,
  ) {
    if (currentMember?.role !== 'owner') {
      throw new AppError('Only the owner can edit this plan.', 'PLAN_UPDATE_PERMISSION_DENIED', 403);
    }

    const normalizedName = input.name.trim();

    if (!normalizedName) {
      throw new AppError('Plan name is required.', 'PLAN_NAME_REQUIRED', 400);
    }

    const startDate = input.startDate ? new Date(input.startDate) : null;
    const endDate = input.endDate ? new Date(input.endDate) : null;
    const { budgetAmount, savingGoalAmount, savingTargetDate } = this.normalizePlanMetrics(input);
    const { closedAt, archivedAt } = this.resolveStatusDates(plan, input.status);

    if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
      throw new AppError('End date must be on or after the start date.', 'PLAN_DATE_RANGE_INVALID', 400);
    }

    await this.planRepository.updatePlan(plan.id, {
      name: normalizedName,
      description: input.description?.trim() || null,
      planType: input.planType,
      status: input.status,
      startDate,
      endDate,
      budgetAmount,
      savingGoalAmount,
      savingTargetDate,
      closedAt,
      archivedAt,
    });
  }

  async closePlan(plan: PlanDocument, currentMember: PlanMemberDocument | null) {
    if (currentMember?.role !== 'owner') {
      throw new AppError('Only the owner can close this plan.', 'PLAN_CLOSE_PERMISSION_DENIED', 403);
    }

    if (this.isEndedPlan(plan)) {
      throw new AppError('This plan is already ended.', 'PLAN_ALREADY_ENDED', 400);
    }

    await this.planRepository.closePlan(plan.id);
  }

  async completePlan(plan: PlanDocument, currentMember: PlanMemberDocument | null) {
    if (currentMember?.role !== 'owner') {
      throw new AppError('Only the owner can complete this plan.', 'PLAN_COMPLETE_PERMISSION_DENIED', 403);
    }

    if (this.isEndedPlan(plan)) {
      throw new AppError('This plan is already ended.', 'PLAN_ALREADY_ENDED', 400);
    }

    await this.planRepository.completePlan(plan.id);
  }

  async archivePlan(plan: PlanDocument, currentMember: PlanMemberDocument | null) {
    if (currentMember?.role !== 'owner') {
      throw new AppError('Only the owner can archive this plan.', 'PLAN_ARCHIVE_PERMISSION_DENIED', 403);
    }

    if (plan.status !== 'active') {
      throw new AppError('Only active plans can be archived.', 'PLAN_ARCHIVE_INVALID_STATUS', 400);
    }

    await this.planRepository.archivePlan(plan.id);
  }

  async unarchivePlan(userId: string, plan: PlanSummary) {
    if (plan.role !== 'owner') {
      throw new AppError('Only the owner can restore this plan.', 'PLAN_UNARCHIVE_PERMISSION_DENIED', 403);
    }

    if (plan.planStatus !== 'archived') {
      throw new AppError('Only archived plans can be restored.', 'PLAN_UNARCHIVE_INVALID_STATUS', 400);
    }

    await this.planRepository.unarchivePlan(plan.planId);
  }

  watchArchivedUserPlans(userId: string, callback: (plans: PlanSummary[]) => void, onError?: (error: Error) => void) {
    return this.planRepository.watchArchivedUserPlans(userId, callback, onError);
  }

  async backfillArchivedAt(userId: string, plan: PlanSummary) {
    if (plan.role !== 'owner' || plan.planStatus !== 'archived' || plan.archivedAt) {
      return;
    }

    await this.planRepository.backfillArchivedAt(userId, plan.planId);
  }

  async hardDeleteArchivedPlan(userId: string, plan: PlanSummary) {
    if (plan.role !== 'owner') {
      throw new AppError('Only the owner can delete this plan.', 'PLAN_DELETE_PERMISSION_DENIED', 403);
    }

    if (plan.planStatus !== 'archived') {
      throw new AppError('Only archived plans can be deleted here.', 'PLAN_NOT_ARCHIVED', 400);
    }

    await this.planRepository.deletePlan(plan.planId, userId);
  }

  async setPlanSecurity(userId: string, planId: string, isLocked: boolean) {
    await this.planRepository.setPlanSecurityForUser(userId, planId, isLocked);
  }

  async clearAllPlanSecurity(userId: string) {
    await this.planRepository.clearAllPlanSecurityForUser(userId);
  }

  async deletePlan(plan: PlanDocument, currentMember: PlanMemberDocument | null) {
    if (currentMember?.role !== 'owner') {
      throw new AppError('Only the owner can delete this plan.', 'PLAN_DELETE_PERMISSION_DENIED', 403);
    }

    await this.planRepository.deletePlan(plan.id, plan.ownerUserId);
  }

  watchPlan(
    planId: string,
    callback: Parameters<PlanRepository['watchPlan']>[1],
    onError?: (error: Error) => void,
  ) {
    return this.planRepository.watchPlan(planId, callback, onError);
  }
}
