import type { AuthUser } from '@/modules/auth/types/auth';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import type { DebtTrackingRepository } from '@/modules/debt-tracking/repositories/debt-tracking.repository';
import type { CreateDebtInput, RecordRepaymentInput } from '@/modules/debt-tracking/types/debt-tracking';
import { AppError } from '@/shared/errors/app-error';

export class DebtTrackingService {
  constructor(private readonly debtTrackingRepository: DebtTrackingRepository) {}

  private assertEditablePlan(plan: PlanDocument) {
    if (plan.status !== 'active') {
      throw new AppError('This plan has ended and cannot be edited.', 'PLAN_ENDED', 400);
    }
  }

  private assertCanManageDebt(currentMember: PlanMemberDocument | null) {
    if (currentMember?.role !== 'owner' && currentMember?.role !== 'editor') {
      throw new AppError('Only owners or editors can manage debts.', 'DEBT_FORBIDDEN', 403);
    }
  }

  async createDebt(
    plan: PlanDocument,
    input: CreateDebtInput,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertCanManageDebt(currentMember);

    if (!input.title.trim()) {
      throw new AppError('Debt title is required.', 'DEBT_TITLE_REQUIRED', 400);
    }

    if (input.principalAmount <= 0) {
      throw new AppError('Debt amount must be greater than zero.', 'DEBT_AMOUNT_INVALID', 400);
    }

    if (!currentMember) {
      throw new AppError('Unable to resolve your plan membership.', 'MEMBER_NOT_FOUND', 400);
    }

    if (!input.counterpartMemberId.trim()) {
      throw new AppError('Please select the member linked to this debt.', 'DEBT_COUNTERPART_REQUIRED', 400);
    }

    if (input.counterpartMemberId === currentMember.id) {
      throw new AppError('Debt counterpart cannot be yourself.', 'DEBT_COUNTERPART_INVALID', 400);
    }

    const borrowerMemberId =
      input.direction === 'borrowed' ? currentMember.id : input.counterpartMemberId;
    const lenderMemberId =
      input.direction === 'lent' ? currentMember.id : input.counterpartMemberId;

    return this.debtTrackingRepository.createDebt({
      title: input.title,
      note: input.note,
      dueDate: input.dueDate,
      principalAmount: input.principalAmount,
      borrowerMemberId,
      lenderMemberId,
      planId: plan.id,
      debtId: this.debtTrackingRepository.generateDebtId(plan.id),
      createdByUserId: currentUser.uid,
      createdByMemberId: currentMember.id,
    });
  }

  async recordRepayment(
    plan: PlanDocument,
    input: RecordRepaymentInput,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertCanManageDebt(currentMember);

    if (input.amount <= 0) {
      throw new AppError('Repayment amount must be greater than zero.', 'REPAYMENT_AMOUNT_INVALID', 400);
    }

    if (!input.paidAt) {
      throw new AppError('Repayment date is required.', 'REPAYMENT_DATE_REQUIRED', 400);
    }

    return this.debtTrackingRepository.recordRepayment({
      ...input,
      planId: plan.id,
      repaymentId: this.debtTrackingRepository.generateRepaymentId(plan.id),
      createdByUserId: currentUser.uid,
      createdByMemberId: currentMember!.id,
    });
  }

  watchDebts(
    planId: string,
    callback: Parameters<DebtTrackingRepository['watchDebts']>[1],
    onError?: (error: Error) => void,
  ) {
    return this.debtTrackingRepository.watchDebts(planId, callback, onError);
  }

  watchRepayments(
    planId: string,
    callback: Parameters<DebtTrackingRepository['watchRepayments']>[1],
    onError?: (error: Error) => void,
  ) {
    return this.debtTrackingRepository.watchRepayments(planId, callback, onError);
  }
}
