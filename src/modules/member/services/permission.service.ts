import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { ConfigurableModuleId, ModuleAccessLevel, PlanCapability } from '@/modules/plan/types/plan-modular';

// Roles & Permissions V2 (docs/roles-permissions.md #6, #26, #27.1).
export const MODULE_SUPPORTED_LEVELS: Record<ConfigurableModuleId, ModuleAccessLevel[]> = {
  planning: ['hidden', 'view', 'manage_own', 'manage_all'],
  finance: ['hidden', 'view', 'manage_own', 'manage_all'],
  weddingGuests: ['hidden', 'view', 'manage_all'],
  travelItinerary: ['hidden', 'view', 'manage_all'],
  members: ['hidden', 'view'],
  debtTracking: ['hidden', 'view'],
};

// Default cho Editor khi member không có override riêng (mục 19, 27.1).
// weddingGuests/travelItinerary = manage_all (giữ hành vi hiện tại, tránh
// regression) — KHÔNG suy diễn máy móc theo nguyên tắc chung ở mục 7.
export const EDITOR_DEFAULT_MODULE_ACCESS: Record<ConfigurableModuleId, ModuleAccessLevel> = {
  planning: 'manage_own',
  finance: 'manage_own',
  weddingGuests: 'manage_all',
  travelItinerary: 'manage_all',
  members: 'view',
  debtTracking: 'view',
};

export function resolveModuleAccess(
  member: PlanMemberDocument | null,
  moduleId: ConfigurableModuleId,
): ModuleAccessLevel {
  if (!member) {
    return 'hidden';
  }

  if (member.role === 'owner') {
    return 'manage_all';
  }

  const supportedLevels = MODULE_SUPPORTED_LEVELS[moduleId];
  const stored = member.permissions.moduleAccess?.[moduleId];
  const level = stored ?? (member.role === 'editor' ? EDITOR_DEFAULT_MODULE_ACCESS[moduleId] : 'view');

  // P3: Viewer never gets write capability, regardless of stored override.
  if (member.role === 'viewer' && level !== 'hidden') {
    return 'view';
  }

  return supportedLevels.includes(level) ? level : 'view';
}

function canManageOwn(level: ModuleAccessLevel): boolean {
  return level === 'manage_own' || level === 'manage_all';
}

function canManageAll(level: ModuleAccessLevel): boolean {
  return level === 'manage_all';
}

const OWNER_CAPABILITIES: PlanCapability[] = [
  'overview.view',
  'planning.view',
  'planning.createMilestone',
  'planning.editOwnMilestone',
  'planning.deleteOwnMilestone',
  'planning.editAllMilestone',
  'planning.deleteAllMilestone',
  'planning.createTodo',
  'planning.editOwnTodo',
  'planning.deleteOwnTodo',
  'planning.editAllTodo',
  'planning.deleteAllTodo',
  'finance.view',
  'finance.createExpense',
  'finance.editOwnExpense',
  'finance.deleteOwnExpense',
  'finance.editAllExpense',
  'finance.deleteAllExpense',
  'finance.createIncome',
  'finance.editOwnIncome',
  'finance.deleteOwnIncome',
  'finance.editAllIncome',
  'finance.deleteAllIncome',
  'finance.manageSettlements',
  'members.view',
  'members.manage',
  'weddingGuests.view',
  'weddingGuests.manageGuest',
  'travelItinerary.view',
  'travelItinerary.createActivity',
  'travelItinerary.editActivity',
  'travelItinerary.deleteActivity',
  'debtTracking.view',
  'debtTracking.viewMemberSnapshot',
  'debtTracking.viewMemberTransaction',
  'debtTracking.manageTransaction',
];

export function resolvePlanCapabilities(member: PlanMemberDocument | null): PlanCapability[] {
  if (!member) {
    return [];
  }

  // P1/P2: Owner always has full access, never downgraded by moduleAccess.
  if (member.role === 'owner') {
    return OWNER_CAPABILITIES;
  }

  const capabilities = new Set<PlanCapability>();
  capabilities.add('overview.view');

  const planningAccess = resolveModuleAccess(member, 'planning');
  if (planningAccess !== 'hidden') {
    capabilities.add('planning.view');

    // Công việc = Planning module = Milestone + Todo (docs/roles-permissions.md
    // #13, amended). UI chỉ expose 1 dropdown "Công việc" nhưng Milestone và
    // Todo vẫn có capability riêng để enforce granular own/all.
    if (canManageOwn(planningAccess)) {
      capabilities.add('planning.createTodo');
      capabilities.add('planning.editOwnTodo');
      capabilities.add('planning.deleteOwnTodo');
      capabilities.add('planning.createMilestone');
      capabilities.add('planning.editOwnMilestone');
      capabilities.add('planning.deleteOwnMilestone');
    }

    if (canManageAll(planningAccess)) {
      capabilities.add('planning.editAllTodo');
      capabilities.add('planning.deleteAllTodo');
      capabilities.add('planning.editAllMilestone');
      capabilities.add('planning.deleteAllMilestone');
    }
  }

  const financeAccess = resolveModuleAccess(member, 'finance');
  if (financeAccess !== 'hidden') {
    capabilities.add('finance.view');

    if (canManageOwn(financeAccess)) {
      capabilities.add('finance.createExpense');
      capabilities.add('finance.editOwnExpense');
      capabilities.add('finance.deleteOwnExpense');
      capabilities.add('finance.createIncome');
      capabilities.add('finance.editOwnIncome');
      capabilities.add('finance.deleteOwnIncome');
    }

    if (canManageAll(financeAccess)) {
      capabilities.add('finance.editAllExpense');
      capabilities.add('finance.deleteAllExpense');
      capabilities.add('finance.editAllIncome');
      capabilities.add('finance.deleteAllIncome');
    }
  }
  // finance.manageSettlements stays Owner-only regardless of finance access
  // level (mục 12) — settlement is not auto-included in manage_all.

  const weddingGuestsAccess = resolveModuleAccess(member, 'weddingGuests');
  if (weddingGuestsAccess !== 'hidden') {
    capabilities.add('weddingGuests.view');

    if (canManageAll(weddingGuestsAccess)) {
      capabilities.add('weddingGuests.manageGuest');
    }
  }

  const travelItineraryAccess = resolveModuleAccess(member, 'travelItinerary');
  if (travelItineraryAccess !== 'hidden') {
    capabilities.add('travelItinerary.view');

    if (canManageAll(travelItineraryAccess)) {
      capabilities.add('travelItinerary.createActivity');
      capabilities.add('travelItinerary.editActivity');
      capabilities.add('travelItinerary.deleteActivity');
    }
  }

  const membersAccess = resolveModuleAccess(member, 'members');
  if (membersAccess !== 'hidden') {
    capabilities.add('members.view');
  }
  // members.manage stays Owner-only — Members module never supports
  // manage_own/manage_all for non-owner (mục 15).

  const debtTrackingAccess = resolveModuleAccess(member, 'debtTracking');
  if (debtTrackingAccess !== 'hidden') {
    capabilities.add('debtTracking.view');
    capabilities.add('debtTracking.viewMemberSnapshot');
    capabilities.add('debtTracking.viewMemberTransaction');
  }
  // debtTracking.manageTransaction stays Owner-only — đặc thù nghiệp vụ Debt
  // Plan, không có access level configurable cho non-owner (mục 27.1).

  return Array.from(capabilities);
}

export function hasPlanCapability(member: PlanMemberDocument | null, capability: PlanCapability): boolean {
  return resolvePlanCapabilities(member).includes(capability);
}

export function resolvePlanPermissions(member: PlanMemberDocument | null) {
  const hasCapability = (capability: PlanCapability) => hasPlanCapability(member, capability);

  return {
    canManagePlan: hasCapability('planning.editAllMilestone'),
    canManageMembers: hasCapability('members.manage'),
    canCreateExpense: hasCapability('finance.createExpense'),
    canEditAllExpenses: hasCapability('finance.editAllExpense'),
    canDeleteAllExpenses: hasCapability('finance.deleteAllExpense'),
    canManageSettlements: hasCapability('finance.manageSettlements'),
  };
}
