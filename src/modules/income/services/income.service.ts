import { AppError } from '@/shared/errors/app-error';
import type { AuthUser } from '@/modules/auth/types/auth';
import type { Category } from '@/modules/category/types/category';
import type { ExpenseDocument } from '@/modules/expense/types/expense';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import { hasPlanCapability } from '@/modules/member/services/permission.service';
import type { PlanDocument } from '@/modules/plan/types/plan';
import type { CreateIncomeInput, IncomeDocument, UpdateIncomeInput } from '@/modules/income/types/income';
import type { IncomeRepository } from '@/modules/income/repositories/income.repository';
import { calculateFundBalance } from '@/modules/statistic/utils/fund-balance';
import { formatCurrency } from '@/shared/utils/currency';

type IncomeContext = {
  plan: PlanDocument;
  members: PlanMemberDocument[];
  currentMember: PlanMemberDocument | null;
  currentUser: AuthUser;
  categories: Category[];
  milestones: MilestoneDocument[];
  expenses: ExpenseDocument[];
  incomes: IncomeDocument[];
};

type FinanceSnapshot = {
  expenses: ExpenseDocument[];
  incomes: IncomeDocument[];
};

export class IncomeService {
  constructor(private readonly incomeRepository: IncomeRepository) {}

  private assertDebtIncomeSemantics(
    plan: PlanDocument,
    currentMember: PlanMemberDocument | null,
    contributedByMemberId: string,
  ) {
    if (plan.planType !== 'debt') {
      return;
    }

    if (!currentMember) {
      throw new AppError('Unable to resolve your plan membership.', 'MEMBER_NOT_FOUND', 400);
    }

    if (contributedByMemberId === currentMember.id) {
      throw new AppError(
        'Trong debt mode, khoản thu phải do thành viên trả lại cho bạn.',
        'DEBT_INCOME_INVALID_CONTRIBUTOR',
        400,
      );
    }
  }

  private assertValidAllocation(allocatedToMemberId: string | null, activeMembers: PlanMemberDocument[]) {
    if (allocatedToMemberId === null) {
      return;
    }

    if (!activeMembers.some((member) => member.id === allocatedToMemberId)) {
      throw new AppError(
        'Thành viên được chọn để hoàn quỹ không hợp lệ trong kế hoạch này.',
        'INCOME_INVALID_ALLOCATION',
        400,
      );
    }
  }

  /**
   * Recomputes the unallocated fund balance with `editedIncomeId` replaced by
   * `projectedIncome` (or removed entirely when `projectedIncome` is null, i.e. delete).
   * A full recompute — rather than a simple amount delta — is required because
   * changing only the allocation (not the amount) can also move money in or out
   * of the unallocated pool that a Fund-paid Expense may already depend on.
   */
  private assertFundSolvency(
    ownerMemberId: string,
    snapshot: FinanceSnapshot,
    editedIncomeId: string,
    projectedIncome: Pick<IncomeDocument, 'amount' | 'status' | 'allocatedToMemberId'> | null,
  ) {
    const projectedIncomes = snapshot.incomes.filter((income) => income.id !== editedIncomeId);

    if (projectedIncome) {
      projectedIncomes.push(projectedIncome as IncomeDocument);
    }

    const projected = calculateFundBalance({
      incomes: projectedIncomes,
      expenses: snapshot.expenses,
      ownerMemberId,
    }).unallocatedBalance;

    if (projected < 0) {
      throw new AppError(
        `Không thể lưu thay đổi này. Sau thay đổi, phần quỹ chưa phân bổ sẽ thiếu ${formatCurrency(Math.abs(projected))}.`,
        'INCOME_FUND_INSUFFICIENT',
        400,
      );
    }
  }

  private assertValidMilestone(planId: string, milestoneId: string, milestones: MilestoneDocument[]) {
    const milestone = milestones.find((item) => item.id === milestoneId);

    if (!milestone || milestone.planId !== planId) {
      throw new AppError('Milestone phải thuộc đúng kế hoạch hiện tại.', 'INCOME_INVALID_MILESTONE', 400);
    }

    return milestone;
  }

  private assertEditablePlan(plan: PlanDocument) {
    if (plan.status !== 'active') {
      throw new AppError('This plan has ended and cannot be edited.', 'PLAN_ENDED', 400);
    }
  }

  async createIncome(input: CreateIncomeInput, context: IncomeContext) {
    this.assertEditablePlan(context.plan);

    if (!hasPlanCapability(context.currentMember, 'finance.createIncome')) {
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
    this.assertDebtIncomeSemantics(context.plan, context.currentMember, input.contributedByMemberId);
    this.assertValidAllocation(input.allocatedToMemberId, activeMembers);

    const milestone = this.assertValidMilestone(context.plan.id, input.milestoneId, context.milestones);

    return this.incomeRepository.createIncome({
      planId: context.plan.id,
      milestoneId: milestone.id,
      title: input.title.trim(),
      categoryId: input.categoryId || null,
      amount: input.amount,
      contributedByMemberId: input.contributedByMemberId,
      allocatedToMemberId: input.allocatedToMemberId,
      note: input.note?.trim() || null,
      receivedAt: input.receivedAt ? new Date(input.receivedAt) : new Date(),
      createdByUser: context.currentUser,
      createdByMember,
    });
  }

  async updateIncome(input: UpdateIncomeInput, context: IncomeContext, income: IncomeDocument) {
    this.assertEditablePlan(context.plan);
    const canEdit =
      hasPlanCapability(context.currentMember, 'finance.editAllIncome') ||
      (hasPlanCapability(context.currentMember, 'finance.editOwnIncome') &&
        income.createdByMemberId === context.currentMember?.id);

    if (!canEdit) {
      throw new AppError('You do not have permission to edit this income.', 'INCOME_EDIT_DENIED', 403);
    }

    const activeMembers = context.members.filter((member) => member.status === 'active');

    if (!activeMembers.some((member) => member.id === input.contributedByMemberId)) {
      throw new AppError('Contributor must be active in this plan.', 'INCOME_INVALID_CONTRIBUTOR', 400);
    }
    this.assertDebtIncomeSemantics(context.plan, context.currentMember, input.contributedByMemberId);
    this.assertValidAllocation(input.allocatedToMemberId, activeMembers);

    this.assertValidMilestone(context.plan.id, input.milestoneId, context.milestones);

    this.assertFundSolvency(
      context.plan.ownerMemberId,
      { expenses: context.expenses, incomes: context.incomes },
      income.id,
      { amount: input.amount, status: 'active', allocatedToMemberId: input.allocatedToMemberId },
    );

    await this.incomeRepository.updateIncome(context.plan.id, input);
  }

  async deleteIncome(
    plan: PlanDocument,
    income: IncomeDocument,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
    financeSnapshot: FinanceSnapshot,
  ) {
    this.assertEditablePlan(plan);
    const canDelete =
      hasPlanCapability(currentMember, 'finance.deleteAllIncome') ||
      (hasPlanCapability(currentMember, 'finance.deleteOwnIncome') && income.createdByMemberId === currentMember?.id);

    if (!canDelete) {
      throw new AppError('You do not have permission to delete this income.', 'INCOME_DELETE_DENIED', 403);
    }

    this.assertFundSolvency(plan.ownerMemberId, financeSnapshot, income.id, null);

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
