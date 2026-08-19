import { AppError } from '@/shared/errors/app-error';
import type { AuthUser } from '@/modules/auth/types/auth';
import { SplitService } from '@/modules/expense/services/split.service';
import type {
  CreateExpenseInput,
  ExpenseDocument,
  ExpenseParticipant,
  SplitMethod,
  UpdateExpenseInput,
} from '@/modules/expense/types/expense';
import type { ExpenseRepository } from '@/modules/expense/repositories/expense.repository';
import type { Category } from '@/modules/category/types/category';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import { hasPlanCapability } from '@/modules/member/services/permission.service';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import { deleteAttachmentsInBackground } from '@/modules/storage/utils/delete-attachments';
import { resolveAttachmentDrafts } from '@/modules/storage/utils/resolve-attachments';

type ExpenseContext = {
  plan: PlanDocument;
  members: PlanMemberDocument[];
  milestones: MilestoneDocument[];
  currentMember: PlanMemberDocument | null;
  currentUser: AuthUser;
  categories: Category[];
};

export class ExpenseService {
  private readonly splitService = new SplitService();

  constructor(private readonly expenseRepository: ExpenseRepository) {}

  private assertEditablePlan(plan: PlanDocument) {
    if (plan.status !== 'active') {
      throw new AppError('This plan has ended and cannot be edited.', 'PLAN_ENDED', 400);
    }
  }

  private assertCreatePermission(currentMember: PlanMemberDocument | null) {
    if (!hasPlanCapability(currentMember, 'finance.createExpense')) {
      throw new AppError('You do not have permission to create expenses.', 'EXPENSE_PERMISSION_DENIED', 403);
    }
  }

  private resolveActiveMembers(members: PlanMemberDocument[]) {
    return members.filter((member) => member.status === 'active');
  }

  private assertValidMilestone(planId: string, milestoneId: string, milestones: MilestoneDocument[]) {
    if (!milestoneId.trim()) {
      throw new AppError('Milestone is required for every expense.', 'EXPENSE_MILESTONE_REQUIRED', 400);
    }

    const milestone = milestones.find((item) => item.id === milestoneId);

    if (!milestone || milestone.planId !== planId) {
      throw new AppError('Selected milestone is not valid for this plan.', 'EXPENSE_INVALID_MILESTONE', 400);
    }

    return milestone;
  }

  private buildParticipants(
    input: { amount: number; splitMethod: SplitMethod; splitValues?: Record<string, number> | undefined },
    participantIds: string[],
  ): ExpenseParticipant[] {
    const values = input.splitValues ?? {};

    switch (input.splitMethod) {
      case 'self':
        return participantIds.slice(0, 1).map((memberId) => ({
          memberId,
          amount: input.amount,
          percentage: null,
          shares: null,
        }));
      case 'equal':
        return this.splitService.equal(input.amount, participantIds);
      case 'exact':
        return this.splitService.exact(
          input.amount,
          participantIds.map((memberId) => ({ memberId, amount: values[memberId]! })),
        );
      case 'percentage':
        return this.splitService.percentage(
          input.amount,
          participantIds.map((memberId) => ({ memberId, percentage: values[memberId]! })),
        );
      case 'shares':
        return this.splitService.shares(
          input.amount,
          participantIds.map((memberId) => ({ memberId, shares: values[memberId]! })),
        );
    }
  }

  async createExpense(input: CreateExpenseInput, context: ExpenseContext) {
    this.assertEditablePlan(context.plan);
    this.assertCreatePermission(context.currentMember);

    const activeMembers = this.resolveActiveMembers(context.members);
    const milestone = this.assertValidMilestone(context.plan.id, input.milestoneId, context.milestones);
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

    const participants = this.buildParticipants(input, participantIds);
    const expenseId = this.expenseRepository.generateExpenseId(context.plan.id);
    const attachments = await resolveAttachmentDrafts(
      { mediaType: 'expense-attachment', planId: context.plan.id, expenseId },
      input.attachments,
    );

    return this.expenseRepository.createExpense({
      planId: context.plan.id,
      expenseId,
      milestoneId: milestone.id,
      activityId: input.activityId?.trim() || null,
      title: input.title.trim(),
      categoryId: input.categoryId || context.categories[0]?.id || null,
      amount: input.amount,
      paidByMemberId: input.paidByMemberId,
      participants,
      splitMethod: input.splitMethod,
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
    const canEditAllExpenses = hasPlanCapability(context.currentMember, 'finance.editAllExpense');
    const canEditOwnExpense = hasPlanCapability(context.currentMember, 'finance.editOwnExpense');
    const canEdit =
      canEditAllExpenses ||
      (canEditOwnExpense && expense.createdByUserId === context.currentUser.uid);

    if (!canEdit) {
      throw new AppError('You do not have permission to edit this expense.', 'EXPENSE_EDIT_DENIED', 403);
    }

    const activeMembers = this.resolveActiveMembers(context.members);
    const milestone = this.assertValidMilestone(context.plan.id, input.milestoneId, context.milestones);
    const participantIds = input.participantMemberIds.filter((memberId) =>
      activeMembers.some((member) => member.id === memberId),
    );
    const participants = this.buildParticipants(input, participantIds);
    const attachments = await resolveAttachmentDrafts(
      { mediaType: 'expense-attachment', planId: context.plan.id, expenseId: expense.id },
      input.attachments,
    );

    const { orphanedAttachments } = await this.expenseRepository.updateExpense(
      context.plan.id,
      { ...input, activityId: input.activityId?.trim() || undefined, milestoneId: milestone.id, attachments },
      participants,
    );
    deleteAttachmentsInBackground(context.plan.id, orphanedAttachments);
  }

  async deleteExpense(
    plan: PlanDocument,
    expense: ExpenseDocument,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    const canDelete =
      hasPlanCapability(currentMember, 'finance.deleteAllExpense') ||
      (hasPlanCapability(currentMember, 'finance.deleteOwnExpense') && expense.createdByUserId === currentUser.uid);

    if (!canDelete) {
      throw new AppError('You do not have permission to delete this expense.', 'EXPENSE_DELETE_DENIED', 403);
    }

    const { orphanedAttachments } = await this.expenseRepository.deleteExpense(plan.id, expense.id, currentUser);
    deleteAttachmentsInBackground(plan.id, orphanedAttachments);
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
