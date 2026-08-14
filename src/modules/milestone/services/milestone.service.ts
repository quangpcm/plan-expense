import type { MilestoneRepository } from '@/modules/milestone/repositories/milestone.repository';
import type { CreateMilestoneInput, ReorderMilestoneInput, UpdateMilestoneInput } from '@/modules/milestone/types/milestone';
import type { AuthUser } from '@/modules/auth/types/auth';
import { resolvePlanPermissions } from '@/modules/member/services/permission.service';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import { AppError } from '@/shared/errors/app-error';

export class MilestoneService {
  constructor(private readonly milestoneRepository: MilestoneRepository) {}

  private assertManagePlanPermission(currentMember: PlanMemberDocument | null) {
    if (!resolvePlanPermissions(currentMember).canManagePlan) {
      throw new AppError('Only the owner can manage milestones.', 'MILESTONE_PERMISSION_DENIED', 403);
    }
  }

  private assertEditablePlan(plan: PlanDocument) {
    if (plan.status !== 'active') {
      throw new AppError('This plan has ended and cannot be edited.', 'PLAN_ENDED', 400);
    }
  }

  async createMilestone(
    plan: PlanDocument,
    input: CreateMilestoneInput,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertManagePlanPermission(currentMember);

    const title = input.title.trim();

    if (!title) {
      throw new AppError('Milestone title is required.', 'MILESTONE_TITLE_REQUIRED', 400);
    }

    const startDate = input.startDate ? new Date(input.startDate) : null;
    const endDate = input.endDate ? new Date(input.endDate) : null;

    if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
      throw new AppError('End date must be on or after the start date.', 'MILESTONE_DATE_RANGE_INVALID', 400);
    }

    return this.milestoneRepository.createMilestone({
      planId: plan.id,
      orderIndex: Number.isFinite(plan.milestoneCount) ? plan.milestoneCount : 0,
      title,
      description: input.description?.trim() || null,
      iconId: input.iconId?.trim() || null,
      startDate,
      endDate,
      budgetAmount: input.budgetAmount ?? null,
      createdByUserId: currentUser.uid,
    });
  }

  async updateMilestone(
    plan: PlanDocument,
    input: UpdateMilestoneInput,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    void currentUser;
    this.assertEditablePlan(plan);
    this.assertManagePlanPermission(currentMember);

    const title = input.title.trim();

    if (!title) {
      throw new AppError('Milestone title is required.', 'MILESTONE_TITLE_REQUIRED', 400);
    }

    const startDate = input.startDate ? new Date(input.startDate) : null;
    const endDate = input.endDate ? new Date(input.endDate) : null;

    if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
      throw new AppError('End date must be on or after the start date.', 'MILESTONE_DATE_RANGE_INVALID', 400);
    }

    await this.milestoneRepository.updateMilestone(plan.id, {
      ...input,
      title,
    });
  }

  async reorderMilestones(
    plan: PlanDocument,
    milestones: ReorderMilestoneInput[],
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertManagePlanPermission(currentMember);
    await this.milestoneRepository.reorderMilestones(plan.id, milestones);
  }

  watchMilestones(
    planId: string,
    callback: Parameters<MilestoneRepository['watchMilestones']>[1],
    onError?: (error: Error) => void,
  ) {
    return this.milestoneRepository.watchMilestones(planId, callback, onError);
  }

  watchMilestone(
    planId: string,
    milestoneId: string,
    callback: Parameters<MilestoneRepository['watchMilestone']>[2],
    onError?: (error: Error) => void,
  ) {
    return this.milestoneRepository.watchMilestone(planId, milestoneId, callback, onError);
  }
}
