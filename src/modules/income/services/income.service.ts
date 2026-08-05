import { AppError } from '@/shared/errors/app-error';
import type { AuthUser } from '@/modules/auth/types/auth';
import type { CategoryDocument } from '@/modules/category/types/category';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { resolvePlanPermissions } from '@/modules/member/services/permission.service';
import type { PlanDocument } from '@/modules/plan/types/plan';
import type { CreateIncomeInput, IncomeDocument } from '@/modules/income/types/income';
import type { IncomeRepository } from '@/modules/income/repositories/income.repository';

type IncomeContext = {
  plan: PlanDocument;
  members: PlanMemberDocument[];
  currentMember: PlanMemberDocument | null;
  currentUser: AuthUser;
  categories: CategoryDocument[];
};

export class IncomeService {
  constructor(private readonly incomeRepository: IncomeRepository) {}

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

    return this.incomeRepository.createIncome({
      planId: context.plan.id,
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

  watchIncomes(planId: string, callback: (incomes: IncomeDocument[]) => void) {
    return this.incomeRepository.watchIncomes(planId, callback);
  }
}
