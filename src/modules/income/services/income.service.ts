import { AppError } from '@/shared/errors/app-error';
import type { AuthUser } from '@/modules/auth/types/auth';
import type { CategoryDocument } from '@/modules/category/types/category';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import { resolvePlanPermissions } from '@/modules/member/services/permission.service';
import type { PlanDocument } from '@/modules/plan/types/plan';
import type { CreateIncomeInput, IncomeDocument, UpdateIncomeInput } from '@/modules/income/types/income';
import type { IncomeRepository } from '@/modules/income/repositories/income.repository';

type IncomeContext = {
  plan: PlanDocument;
  members: PlanMemberDocument[];
  currentMember: PlanMemberDocument | null;
  currentUser: AuthUser;
  categories: CategoryDocument[];
  milestones: MilestoneDocument[];
};

export class IncomeService {
  constructor(private readonly incomeRepository: IncomeRepository) {}

  private assertValidMilestone(planId: string, milestoneId: string, milestones: MilestoneDocument[]) {
    const milestone = milestones.find((item) => item.id === milestoneId);

    if (!milestone || milestone.planId !== planId) {
      throw new AppError('Milestone phải thuộc đúng kế hoạch hiện tại.', 'INCOME_INVALID_MILESTONE', 400);
    }

    return milestone;
  }

  private assertEditablePlan(plan: PlanDocument) {
    if (plan.status === 'closed') {
      throw new AppError('This plan is closed and cannot be edited.', 'PLAN_CLOSED', 400);
    }
  }

  async createIncome(input: CreateIncomeInput, context: IncomeContext) {
    this.assertEditablePlan(context.plan);

    if (!resolvePlanPermissions(context.currentMember).canCreateIncome) {
      throw new AppError('You do not have permission to create incomes.', 'INCOME_PERMISSION_DENIED', 403);
    }

    const createdByMember = context.currentMember;

    if (!createdByMember) {
      throw new AppError('Unable to resolve your plan membership.', 'MEMBER_NOT_FOUND', 400);
    }

    const activeMembers = context.members.filter((member) => member.status === 'active');

    if (!activeMembers.some((member) => member.id === input.contributedByMemberId)) {
      throw new AppError('Contributor must be active in this plan.', 'INCOME_INVALID_CONTRIBUTOR', 400);
    }

    const milestone = this.assertValidMilestone(context.plan.id, input.milestoneId, context.milestones);

    return this.incomeRepository.createIncome({
      planId: context.plan.id,
      milestoneId: milestone.id,
      title: input.title.trim(),
      categoryId: input.categoryId || null,
      amount: input.amount,
      contributedByMemberId: input.contributedByMemberId,
      note: input.note?.trim() || null,
      receivedAt: input.receivedAt ? new Date(input.receivedAt) : new Date(),
      createdByUser: context.currentUser,
      createdByMember,
    });
  }

  async updateIncome(input: UpdateIncomeInput, context: IncomeContext, income: IncomeDocument) {
    this.assertEditablePlan(context.plan);
    const permissions = resolvePlanPermissions(context.currentMember);
    const canEdit = permissions.canEditOwnIncome && income.createdByMemberId === context.currentMember?.id;

    if (!canEdit) {
      throw new AppError('You do not have permission to edit this income.', 'INCOME_EDIT_DENIED', 403);
    }

    const activeMembers = context.members.filter((member) => member.status === 'active');

    if (!activeMembers.some((member) => member.id === input.contributedByMemberId)) {
      throw new AppError('Contributor must be active in this plan.', 'INCOME_INVALID_CONTRIBUTOR', 400);
    }

    this.assertValidMilestone(context.plan.id, input.milestoneId, context.milestones);

    await this.incomeRepository.updateIncome(context.plan.id, input);
  }

  async deleteIncome(
    plan: PlanDocument,
    income: IncomeDocument,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    const permissions = resolvePlanPermissions(currentMember);
    const canDelete = permissions.canDeleteOwnIncome && income.createdByMemberId === currentMember?.id;

    if (!canDelete) {
      throw new AppError('You do not have permission to delete this income.', 'INCOME_DELETE_DENIED', 403);
    }

    await this.incomeRepository.softDeleteIncome(plan.id, income.id, currentUser);
  }

  watchIncomes(planId: string, callback: (incomes: IncomeDocument[]) => void, onError?: (error: Error) => void) {
    return this.incomeRepository.watchIncomes(planId, callback, onError);
  }

  watchIncome(
    planId: string,
    incomeId: string,
    callback: (income: IncomeDocument | null) => void,
    onError?: (error: Error) => void,
  ) {
    return this.incomeRepository.watchIncome(planId, incomeId, callback, onError);
  }
}
