import type { PlanMemberDocument, PlanRole } from '@/modules/member/types/member';
import type { PlanCapability } from '@/modules/plan/types/plan-modular';

export function resolvePlanCapabilities(member: PlanMemberDocument | null): PlanCapability[] {
  const role: PlanRole | null = member?.role ?? null;
  const canEditAllExpenses = Boolean(member?.permissions.canEditAllExpenses);
  const isOwner = role === 'owner';
  const isEditor = role === 'editor';
  const capabilities = new Set<PlanCapability>();

  if (role !== null) {
    capabilities.add('overview.view');
    capabilities.add('planning.view');
    capabilities.add('finance.view');
    capabilities.add('members.view');
    capabilities.add('travelItinerary.view');
    capabilities.add('debtTracking.view');
    capabilities.add('debtTracking.viewMemberSnapshot');
    capabilities.add('debtTracking.viewMemberTransaction');
  }

  if (isOwner) {
    capabilities.add('members.manage');
    capabilities.add('planning.createMilestone');
    capabilities.add('planning.createTodo');
    capabilities.add('planning.editTodo');
    capabilities.add('finance.createExpense');
    capabilities.add('finance.editOwnExpense');
    capabilities.add('finance.deleteOwnExpense');
    capabilities.add('finance.editAllExpense');
    capabilities.add('finance.deleteAllExpense');
    capabilities.add('finance.createIncome');
    capabilities.add('finance.editOwnIncome');
    capabilities.add('finance.deleteOwnIncome');
    capabilities.add('finance.manageSettlements');
    capabilities.add('weddingGuests.manageGuest');
    capabilities.add('travelItinerary.createActivity');
    capabilities.add('travelItinerary.editActivity');
    capabilities.add('travelItinerary.deleteActivity');
  }

  if (isEditor) {
    capabilities.add('finance.createExpense');
    capabilities.add('finance.editOwnExpense');
    capabilities.add('finance.deleteOwnExpense');
    capabilities.add('finance.createIncome');
    capabilities.add('finance.editOwnIncome');
    capabilities.add('finance.deleteOwnIncome');
    capabilities.add('weddingGuests.manageGuest');
    capabilities.add('travelItinerary.createActivity');
    capabilities.add('travelItinerary.editActivity');
  }

  if (isOwner || canEditAllExpenses) {
    capabilities.add('finance.editAllExpense');
    capabilities.add('finance.deleteAllExpense');
  }

  return Array.from(capabilities);
}

export function hasPlanCapability(member: PlanMemberDocument | null, capability: PlanCapability): boolean {
  return resolvePlanCapabilities(member).includes(capability);
}

export function resolvePlanPermissions(member: PlanMemberDocument | null) {
  const hasCapability = (capability: PlanCapability) =>
    hasPlanCapability(member, capability);

  return {
    canManagePlan: hasCapability('planning.createMilestone'),
    canManageMembers: hasCapability('members.manage'),
    canCreateExpense: hasCapability('finance.createExpense'),
    canEditAllExpenses: hasCapability('finance.editAllExpense'),
    canDeleteAllExpenses: hasCapability('finance.deleteAllExpense'),
    canManageSettlements: hasCapability('finance.manageSettlements'),
  };
}
