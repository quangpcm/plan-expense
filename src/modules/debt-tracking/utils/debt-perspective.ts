import type { DebtDirection, DebtDocument } from '@/modules/debt-tracking/types/debt-tracking';
import type { PlanMemberDocument } from '@/modules/member/types/member';

export function resolveDebtDirection(debt: DebtDocument, currentMemberId: string | null): DebtDirection | null {
  if (!currentMemberId) {
    return null;
  }

  if (debt.lenderMemberId === currentMemberId) {
    return 'lent';
  }

  if (debt.borrowerMemberId === currentMemberId) {
    return 'borrowed';
  }

  return null;
}

export function resolveDebtCounterpart(
  debt: DebtDocument,
  members: PlanMemberDocument[],
  currentMemberId: string | null,
) {
  const direction = resolveDebtDirection(debt, currentMemberId);

  if (direction === 'lent') {
    return members.find((member) => member.id === debt.borrowerMemberId) ?? null;
  }

  if (direction === 'borrowed') {
    return members.find((member) => member.id === debt.lenderMemberId) ?? null;
  }

  return null;
}

export function formatDebtDirectionLabel(direction: DebtDirection | null) {
  if (direction === 'lent') {
    return 'Tôi cho mượn';
  }

  if (direction === 'borrowed') {
    return 'Tôi đi mượn';
  }

  return 'Khoản vay';
}
