import type { PlanType } from '@/modules/plan/types/plan';

export type ModularPlanType = 'general' | 'wedding' | 'travel' | 'debt';

export type PlanModuleId =
  | 'overview'
  | 'planning'
  | 'finance'
  | 'members'
  | 'weddingGuests'
  | 'travelItinerary'
  | 'debtTracking';

export type PlanCapability =
  | 'overview.view'
  | 'planning.view'
  | 'planning.manageMilestone'
  | 'planning.createTodo'
  | 'planning.editOwnTodo'
  | 'planning.deleteOwnTodo'
  | 'planning.editAllTodo'
  | 'planning.deleteAllTodo'
  | 'finance.view'
  | 'finance.createExpense'
  | 'finance.editOwnExpense'
  | 'finance.deleteOwnExpense'
  | 'finance.editAllExpense'
  | 'finance.deleteAllExpense'
  | 'finance.createIncome'
  | 'finance.editOwnIncome'
  | 'finance.deleteOwnIncome'
  | 'finance.editAllIncome'
  | 'finance.deleteAllIncome'
  | 'finance.manageSettlements'
  | 'members.view'
  | 'members.manage'
  | 'weddingGuests.view'
  | 'weddingGuests.manageGuest'
  | 'travelItinerary.view'
  | 'travelItinerary.createActivity'
  | 'travelItinerary.editActivity'
  | 'travelItinerary.deleteActivity'
  | 'debtTracking.view'
  | 'debtTracking.viewMemberSnapshot'
  | 'debtTracking.viewMemberTransaction'
  | 'debtTracking.manageTransaction';

// Roles & Permissions V2 — xem docs/roles-permissions.md
export type ModuleAccessLevel = 'hidden' | 'view' | 'manage_own' | 'manage_all';

// Module có access level configurable qua Permission UI (mục 24). 'overview'
// không nằm trong đây — Overview luôn tự động filter theo module gốc (mục 16).
export type ConfigurableModuleId = Exclude<PlanModuleId, 'overview'>;

export type OverviewWidgetId =
  | 'planSummary'
  | 'planningSnapshot'
  | 'financeSummary'
  | 'memberSummary'
  | 'travelTripStatus'
  | 'travelPlanningProgress'
  | 'travelAttentionTodos'
  | 'weddingGuestSummary'
  | 'weddingAttentionSummary'
  | 'weddingMilestoneSnapshot'
  | 'weddingTodoSnapshot'
  | 'weddingFinanceSummary'
  | 'weddingGuestFinanceSummary'
  | 'travelItinerarySummary'
  | 'debtSummary'
  | 'debtOverviewSummary';

export type PlanModuleRoute = {
  key: string;
  pathname: string;
};

export type PlanModuleCollection = {
  path: string;
};

export type OverviewWidgetDefinition = {
  id: OverviewWidgetId;
  moduleId: PlanModuleId;
};

export type OverviewWidgetConfig = {
  widgetId: OverviewWidgetId;
  enabled: boolean;
  order: number;
};

export type PlanModuleDefinition = {
  id: PlanModuleId;
  defaultLabel: string;
  navigation: {
    enabled: boolean;
  };
  permissions?: PlanCapability[] | undefined;
  // Module Access Level nào module này cho phép owner chọn cho 1 member
  // (mục 26). Không set với 'overview' — module đó không configurable.
  supportedAccessLevels?: ModuleAccessLevel[] | undefined;
  requires?: PlanModuleId[] | undefined;
  optionalDependencies?: PlanModuleId[] | undefined;
  routes?: PlanModuleRoute[] | undefined;
  collections?: PlanModuleCollection[] | undefined;
  overviewWidgets?: OverviewWidgetDefinition[] | undefined;
};

export type PlanModuleConfig = {
  moduleId: PlanModuleId;
  enabled: boolean;
  order: number;
  label?: string | undefined;
};

export type OverviewConfig = {
  widgets: OverviewWidgetConfig[];
};

export type PlanTypeConfig = {
  type: ModularPlanType;
  label: string;
  modules: PlanModuleConfig[];
  overview: OverviewConfig;
};

export type SupportedPlanTypeConfigMap = Record<
  ModularPlanType,
  PlanTypeConfig
>;

export type PlanTypeConfigFallbackMap = Partial<
  Record<PlanType, ModularPlanType>
>;
