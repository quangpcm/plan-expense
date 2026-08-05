import { AppError } from '@/shared/errors/app-error';
import type { AuthUser } from '@/modules/auth/types/auth';
import { SplitService } from '@/modules/expense/services/split.service';
import { uploadExpenseAttachments } from '@/modules/expense/utils/attachment';
import type {
  CreateExpenseInput,
  ExpenseDocument,
  UpdateExpenseInput,
} from '@/modules/expense/types/expense';
import type { ExpenseRepository } from '@/modules/expense/repositories/expense.repository';
import type { CategoryDocument } from '@/modules/category/types/category';
import { resolvePlanPermissions } from '@/modules/member/services/permission.service';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';

type ExpenseContext = {
  plan: PlanDocument;
  members: PlanMemberDocument[];
  currentMember: PlanMemberDocument | null;
  currentUser: AuthUser;
  categories: CategoryDocument[];
};

export class ExpenseService {
  private readonly splitService = new SplitService();

  constructor(private readonly expenseRepository: ExpenseRepository) {}

  private assertEditablePlan(plan: PlanDocument) {
    if (plan.status === 'closed') {
      throw new AppError('This plan is closed and cannot be edited.', 'PLAN_CLOSED', 400);
    }
  }

  private assertCreatePermission(currentMember: PlanMemberDocument | null) {
    if (!resolvePlanPermissions(currentMember).canCreateExpense) {
      throw new AppError('You do not have permission to create expenses.', 'EXPENSE_PERMISSION_DENIED', 403);
    }
  }

  private resolveActiveMembers(members: PlanMemberDocument[]) {
    return members.filter((member) => member.status === 'active');
  }

  async createExpense(input: CreateExpenseInput, context: ExpenseContext) {
    this.assertEditablePlan(context.plan);
    this.assertCreatePermission(context.currentMember);

    const activeMembers = this.resolveActiveMembers(context.members);
    const participantIds = input.participantMemberIds.filter((memberId) =>
      activeMembers.some((member) => member.id === memberId),
    );

    if (!activeMembers.some((member) => member.id === input.paidByMemberId)) {
      throw new AppError('Paid by member must be active in this plan.', 'EXPENSE_INVALID_PAYER', 400);
    }

    const createdByMember = context.currentMember;

    if (!createdByMember) {
      throw new AppError('Unable to resolve your plan membership.', 'MEMBER_NOT_FOUND', 400);
    }

    const participants = this.splitService.equal(input.amount, participantIds);
    const tempExpenseId = crypto.randomUUID();
    const attachments = await uploadExpenseAttachments(context.plan.id, tempExpenseId, input.attachments);

    return this.expenseRepository.createExpense({
      planId: context.plan.id,
      title: input.title.trim(),
      categoryId: input.categoryId || context.categories[0]?.id || null,
      amount: input.amount,
      paidByMemberId: input.paidByMemberId,
      participants,
      merchantName: input.merchantName?.trim() || null,
      locationName: input.locationName?.trim() || null,
      note: input.note?.trim() || null,
      spentAt: input.spentAt ? new Date(input.spentAt) : new Date(),
      createdByUser: context.currentUser,
      createdByMember,
      attachments,
    });
  }

  async updateExpense(input: UpdateExpenseInput, context: ExpenseContext, expense: ExpenseDocument) {
    this.assertEditablePlan(context.plan);
    const permissions = resolvePlanPermissions(context.currentMember);
    const canEdit = permissions.canEditAllExpenses || expense.createdByUserId === context.currentUser.uid;

    if (!canEdit) {
      throw new AppError('You do not have permission to edit this expense.', 'EXPENSE_EDIT_DENIED', 403);
    }

    const activeMembers = this.resolveActiveMembers(context.members);
    const participantIds = input.participantMemberIds.filter((memberId) =>
      activeMembers.some((member) => member.id === memberId),
    );
    const participants = this.splitService.equal(input.amount, participantIds);

    await this.expenseRepository.updateExpense(context.plan.id, input, participants);
  }

  async deleteExpense(
    plan: PlanDocument,
    expense: ExpenseDocument,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    const permissions = resolvePlanPermissions(currentMember);
    const canDelete = permissions.canDeleteAllExpenses || expense.createdByUserId === currentUser.uid;

    if (!canDelete) {
      throw new AppError('You do not have permission to delete this expense.', 'EXPENSE_DELETE_DENIED', 403);
    }

    await this.expenseRepository.softDeleteExpense(plan.id, expense.id, currentUser);
  }

  watchExpenses(planId: string, callback: (expenses: ExpenseDocument[]) => void, onError?: (error: Error) => void) {
    return this.expenseRepository.watchExpenses(planId, callback, onError);
  }

  watchExpense(
    planId: string,
    expenseId: string,
    callback: (expense: ExpenseDocument | null) => void,
    onError?: (error: Error) => void,
  ) {
    return this.expenseRepository.watchExpense(planId, expenseId, callback, onError);
  }
}
