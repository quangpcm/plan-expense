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
  | 'planning.createMilestone'
  | 'planning.createTodo'
  | 'planning.editTodo'
  | 'finance.view'
  | 'finance.createExpense'
  | 'finance.editOwnExpense'
  | 'finance.deleteOwnExpense'
  | 'finance.editAllExpense'
  | 'finance.deleteAllExpense'
  | 'finance.createIncome'
  | 'finance.editOwnIncome'
  | 'finance.deleteOwnIncome'
  | 'finance.manageSettlements'
  | 'members.view'
  | 'members.manage'
  | 'weddingGuests.manageGuest'
  | 'travelItinerary.view'
  | 'travelItinerary.createActivity'
  | 'travelItinerary.editActivity'
  | 'travelItinerary.deleteActivity'
  | 'debtTracking.view'
  | 'debtTracking.viewMemberSnapshot'
  | 'debtTracking.viewMemberTransaction'
  | 'debtTracking.manageTransaction';

export type OverviewWidgetId =
  | 'planSummary'
  | 'planningSnapshot'
  | 'financeSummary'
  | 'memberSummary'
  | 'weddingGuestSummary'
  | 'weddingAttentionSummary'
  | 'weddingMilestoneSnapshot'
  | 'weddingTodoSnapshot'
  | 'weddingFinanceSummary'
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
