import { AppError } from '@/shared/errors/app-error';
import type { AuthUser } from '@/modules/auth/types/auth';
import { hasPlanCapability } from '@/modules/member/services/permission.service';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import { deleteAttachmentsInBackground } from '@/modules/storage/utils/delete-attachments';
import { resolveAttachmentDrafts } from '@/modules/storage/utils/resolve-attachments';
import { validateRepaymentAmount } from '@/modules/debt-tracking/calculators/debt-calculators';
import type { DebtTransactionRepository } from '@/modules/debt-tracking/repositories/debt-transaction.repository';
import type {
  CreateDebtTransactionInput,
  DebtTransaction,
  UpdateDebtTransactionInput,
} from '@/modules/debt-tracking/types/debt-transaction';

type DebtTransactionContext = {
  plan: PlanDocument;
  currentMember: PlanMemberDocument | null;
  currentUser: AuthUser;
  existingTransactions: DebtTransaction[];
};

export class DebtTransactionService {
  constructor(private readonly debtTransactionRepository: DebtTransactionRepository) {}

  private assertEditablePlan(plan: PlanDocument) {
    if (plan.status !== 'active') {
      throw new AppError('This plan has ended and cannot be edited.', 'PLAN_ENDED', 400);
    }
  }

  private assertManagePermission(currentMember: PlanMemberDocument | null) {
    if (!hasPlanCapability(currentMember, 'debtTracking.manageTransaction')) {
      throw new AppError(
        'You do not have permission to manage debt transactions.',
        'DEBT_TRANSACTION_PERMISSION_DENIED',
        403,
      );
    }
  }

  async createDebtTransaction(input: CreateDebtTransactionInput, context: DebtTransactionContext) {
    this.assertEditablePlan(context.plan);
    this.assertManagePermission(context.currentMember);

    if (!context.currentMember) {
      throw new AppError('Unable to resolve your plan membership.', 'MEMBER_NOT_FOUND', 400);
    }

    if (input.type === 'repayment') {
      const { valid, outstanding } = validateRepaymentAmount(
        context.existingTransactions,
        input.counterpartyMemberId,
        input.direction,
        input.amount,
      );

      if (!valid) {
        throw new AppError(
          `Số tiền trả không được vượt quá số tiền còn nợ (${outstanding.toLocaleString('vi-VN')}đ).`,
          'DEBT_REPAYMENT_EXCEEDS_OUTSTANDING',
          400,
        );
      }
    }

    const transactionId = this.debtTransactionRepository.generateDebtTransactionId(context.plan.id);
    const attachments = await resolveAttachmentDrafts(
      { mediaType: 'debt-transaction-attachment', planId: context.plan.id, transactionId },
      input.attachments,
    );

    return this.debtTransactionRepository.createDebtTransaction({
      planId: context.plan.id,
      transactionId,
      counterpartyMemberId: input.counterpartyMemberId,
      direction: input.direction,
      type: input.type,
      amount: input.amount,
      occurredAt: input.occurredAt,
      dueDate: input.type === 'loan' ? input.dueDate ?? null : null,
      note: input.note?.trim() || null,
      attachments,
      createdByUser: context.currentUser,
      createdByMember: context.currentMember,
    });
  }

  async updateDebtTransaction(
    input: UpdateDebtTransactionInput,
    context: DebtTransactionContext,
    transaction: DebtTransaction,
  ) {
    this.assertEditablePlan(context.plan);
    this.assertManagePermission(context.currentMember);

    if (transaction.type === 'repayment') {
      const { valid, outstanding } = validateRepaymentAmount(
        context.existingTransactions,
        transaction.counterpartyMemberId,
        transaction.direction,
        input.amount,
        transaction.id,
      );

      if (!valid) {
        throw new AppError(
          `Số tiền trả không được vượt quá số tiền còn nợ (${outstanding.toLocaleString('vi-VN')}đ).`,
          'DEBT_REPAYMENT_EXCEEDS_OUTSTANDING',
          400,
        );
      }
    }

    const attachments = await resolveAttachmentDrafts(
      { mediaType: 'debt-transaction-attachment', planId: context.plan.id, transactionId: transaction.id },
      input.attachments,
    );

    const { orphanedAttachments } = await this.debtTransactionRepository.updateDebtTransaction(context.plan.id, {
      transactionId: input.transactionId,
      amount: input.amount,
      occurredAt: input.occurredAt,
      dueDate: transaction.type === 'loan' ? input.dueDate ?? null : null,
      note: input.note?.trim() || null,
      attachments,
    });

    deleteAttachmentsInBackground(context.plan.id, orphanedAttachments);
  }

  async deleteDebtTransaction(
    plan: PlanDocument,
    transaction: DebtTransaction,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertManagePermission(currentMember);

    const { orphanedAttachments } = await this.debtTransactionRepository.deleteDebtTransaction(
      plan.id,
      transaction.id,
    );

    deleteAttachmentsInBackground(plan.id, orphanedAttachments);
  }

  watchDebtTransactions(
    planId: string,
    callback: (transactions: DebtTransaction[]) => void,
    onError?: (error: Error) => void,
  ) {
    return this.debtTransactionRepository.watchDebtTransactions(planId, callback, onError);
  }
}
