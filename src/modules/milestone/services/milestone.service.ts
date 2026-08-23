import type { MilestoneRepository } from '@/modules/milestone/repositories/milestone.repository';
import type {
  CreateMilestoneInput,
  MilestoneDocument,
  ReorderMilestoneInput,
  UpdateMilestoneInput,
} from '@/modules/milestone/types/milestone';
import type { AuthUser } from '@/modules/auth/types/auth';
import { hasPlanCapability } from '@/modules/member/services/permission.service';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import { deleteAttachmentsInBackground } from '@/modules/storage/utils/delete-attachments';
import { AppError } from '@/shared/errors/app-error';

export class MilestoneService {
  constructor(private readonly milestoneRepository: MilestoneRepository) {}

  private assertCreatePermission(currentMember: PlanMemberDocument | null) {
    if (!hasPlanCapability(currentMember, 'planning.createMilestone')) {
      throw new AppError('You do not have permission to create milestones.', 'MILESTONE_PERMISSION_DENIED', 403);
    }
  }

  private assertCanEditMilestone(
    currentMember: PlanMemberDocument | null,
    milestone: MilestoneDocument,
    currentUser: AuthUser,
  ) {
    const canEditAll = hasPlanCapability(currentMember, 'planning.editAllMilestone');
    const canEditOwn =
      hasPlanCapability(currentMember, 'planning.editOwnMilestone') && milestone.createdByUserId === currentUser.uid;

    if (!canEditAll && !canEditOwn) {
      throw new AppError('You do not have permission to edit this milestone.', 'MILESTONE_PERMISSION_DENIED', 403);
    }
  }

  private assertCanDeleteMilestone(
    currentMember: PlanMemberDocument | null,
    milestone: MilestoneDocument,
    currentUser: AuthUser,
  ) {
    const canDeleteAll = hasPlanCapability(currentMember, 'planning.deleteAllMilestone');
    const canDeleteOwn =
      hasPlanCapability(currentMember, 'planning.deleteOwnMilestone') && milestone.createdByUserId === currentUser.uid;

    if (!canDeleteAll && !canDeleteOwn) {
      throw new AppError('You do not have permission to delete this milestone.', 'MILESTONE_PERMISSION_DENIED', 403);
    }
  }

  // Reorder sắp xếp lại toàn bộ danh sách milestone trong 1 lần, không scope
  // theo 1 record sở hữu riêng lẻ, nên cần manage-all (mirrors todo.service.ts).
  private assertCanManageAllMilestones(currentMember: PlanMemberDocument | null) {
    if (!hasPlanCapability(currentMember, 'planning.editAllMilestone')) {
      throw new AppError('You do not have permission to reorganize milestones.', 'MILESTONE_PERMISSION_DENIED', 403);
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
    this.assertCreatePermission(currentMember);

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
    milestone: MilestoneDocument,
    input: UpdateMilestoneInput,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertCanEditMilestone(currentMember, milestone, currentUser);

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
    this.assertCanManageAllMilestones(currentMember);
    await this.milestoneRepository.reorderMilestones(plan.id, milestones);
  }

  async deleteMilestone(
    plan: PlanDocument,
    milestone: MilestoneDocument,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertCanDeleteMilestone(currentMember, milestone, currentUser);

    if (milestone.isSystemHidden) {
      throw new AppError('System hidden milestone cannot be deleted.', 'MILESTONE_SYSTEM_HIDDEN_DELETE_DENIED', 400);
    }

    const { orphanedAttachments } = await this.milestoneRepository.deleteMilestone(plan.id, milestone.id);
    deleteAttachmentsInBackground(plan.id, orphanedAttachments);
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
