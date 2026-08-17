import type {
  PlanMemberDocument,
  PlanRole,
  ResolvedPlanPermissions,
} from '@/modules/member/types/member';

export function resolvePlanPermissions(member: PlanMemberDocument | null): ResolvedPlanPermissions {
  const role: PlanRole | null = member?.role ?? null;
  const canEditAllExpenses = Boolean(member?.permissions.canEditAllExpenses);
  const isOwner = role === 'owner';
  const isEditor = role === 'editor';

  return {
    canManagePlan: isOwner,
    canManageMembers: isOwner,
    canCreateExpense: isOwner || isEditor,
    canEditOwnExpense: isOwner || isEditor,
    canDeleteOwnExpense: isOwner || isEditor,
    canEditAllExpenses: isOwner || canEditAllExpenses,
    canDeleteAllExpenses: isOwner,
    canCreateIncome: isOwner || isEditor,
    canEditOwnIncome: isOwner || isEditor,
    canDeleteOwnIncome: isOwner || isEditor,
    canViewStatistics: role !== null,
    canManageSettlements: isOwner,
    canManageWeddingGuest: isOwner || isEditor,
  };
}

