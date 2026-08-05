import { AppError } from '@/shared/errors/app-error';
import type { AuthUser } from '@/modules/auth/types/auth';
import { resolvePlanPermissions } from '@/modules/member/services/permission.service';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import type { MemberBalanceRow } from '@/modules/statistic/types/statistic';
import type { SettlementRepository } from '@/modules/settlement/repositories/settlement.repository';
import type {
  ConfirmSettlementInput,
  SettlementDocument,
  SettlementSuggestion,
} from '@/modules/settlement/types/settlement';

type SettlementContext = {
  plan: PlanDocument;
  members: PlanMemberDocument[];
  currentMember: PlanMemberDocument | null;
  currentUser: AuthUser;
};

export class SettlementService {
  constructor(private readonly settlementRepository: SettlementRepository) {}

  private assertManagePermission(currentMember: PlanMemberDocument | null) {
    if (!resolvePlanPermissions(currentMember).canManageSettlements) {
      throw new AppError('Only the owner can manage settlements.', 'SETTLEMENT_PERMISSION_DENIED', 403);
    }
  }

  private assertEditablePlan(plan: PlanDocument) {
    if (plan.status === 'closed') {
      throw new AppError('This plan is closed and cannot be edited.', 'PLAN_CLOSED', 400);
    }
  }

  suggest(memberBalances: MemberBalanceRow[]): SettlementSuggestion[] {
    const creditors = memberBalances
      .filter((row) => row.adjustedBalance > 0)
      .map((row) => ({
        memberId: row.memberId,
        amount: row.adjustedBalance,
      }));
    const debtors = memberBalances
      .filter((row) => row.adjustedBalance < 0)
      .map((row) => ({
        memberId: row.memberId,
        amount: Math.abs(row.adjustedBalance),
      }));
    const suggestions: SettlementSuggestion[] = [];

    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];

      if (!creditor || !debtor) {
        break;
      }

      const amount = Math.min(creditor.amount, debtor.amount);

      if (amount > 0) {
        suggestions.push({
          fromMemberId: debtor.memberId,
          toMemberId: creditor.memberId,
          amount,
        });
      }

      creditor.amount -= amount;
      debtor.amount -= amount;

      if (creditor.amount === 0) {
        creditorIndex += 1;
      }

      if (debtor.amount === 0) {
        debtorIndex += 1;
      }
    }

    return suggestions;
  }

  async confirm(input: ConfirmSettlementInput, context: SettlementContext) {
    this.assertEditablePlan(context.plan);
    this.assertManagePermission(context.currentMember);

    if (input.fromMemberId === input.toMemberId) {
      throw new AppError('Settlement members must be different.', 'SETTLEMENT_INVALID_MEMBER_PAIR', 400);
    }

    if (input.amount <= 0) {
      throw new AppError('Settlement amount must be greater than zero.', 'SETTLEMENT_INVALID_AMOUNT', 400);
    }

    const allMembers = context.members.filter((member) => member.status !== 'invited');

    if (!allMembers.some((member) => member.id === input.fromMemberId)) {
      throw new AppError('The payer member is not valid in this plan.', 'SETTLEMENT_FROM_MEMBER_NOT_FOUND', 400);
    }

    if (!allMembers.some((member) => member.id === input.toMemberId)) {
      throw new AppError('The receiver member is not valid in this plan.', 'SETTLEMENT_TO_MEMBER_NOT_FOUND', 400);
    }

    const createdByMember = context.currentMember;

    if (!createdByMember) {
      throw new AppError('Unable to resolve your plan membership.', 'MEMBER_NOT_FOUND', 400);
    }

    return this.settlementRepository.createSettlement({
      ...input,
      planId: context.plan.id,
      settledAt: new Date(),
      createdByUser: context.currentUser,
      createdByMember,
    });
  }

  async cancel(
    plan: PlanDocument,
    settlement: SettlementDocument,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertManagePermission(currentMember);
    await this.settlementRepository.cancelSettlement(plan.id, settlement.id, currentUser);
  }

  watchSettlements(
    planId: string,
    callback: (settlements: SettlementDocument[]) => void,
    onError?: (error: Error) => void,
  ) {
    return this.settlementRepository.watchSettlements(planId, callback, onError);
  }
}
