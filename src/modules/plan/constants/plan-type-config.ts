import { planModuleRegistry } from '@/modules/plan/constants/plan-module-registry';
import type {
  ModularPlanType,
  PlanTypeConfig,
  PlanTypeConfigFallbackMap,
  SupportedPlanTypeConfigMap,
} from '@/modules/plan/types/plan-modular';
import type { PlanType } from '@/modules/plan/types/plan';

export const modularPlanTypeFallbackMap: PlanTypeConfigFallbackMap = {
  saving: 'general',
  birthday: 'general',
  event: 'general',
  shared_living: 'general',
  project: 'general',
};

export const supportedModularPlanTypes: ModularPlanType[] = ['general', 'wedding', 'travel', 'debt'];

export const planTypeConfigMap: SupportedPlanTypeConfigMap = {
  general: {
    type: 'general',
    label: 'Chung',
    modules: [
      { moduleId: 'overview', enabled: true, order: 0, label: planModuleRegistry.overview.defaultLabel },
      { moduleId: 'planning', enabled: true, order: 10, label: planModuleRegistry.planning.defaultLabel },
      { moduleId: 'finance', enabled: true, order: 20, label: planModuleRegistry.finance.defaultLabel },
      { moduleId: 'members', enabled: true, order: 30, label: planModuleRegistry.members.defaultLabel },
    ],
    overview: {
      widgets: [
        { widgetId: 'planSummary', enabled: true, order: 0 },
        { widgetId: 'planningSnapshot', enabled: true, order: 10 },
        { widgetId: 'financeSummary', enabled: true, order: 20 },
        { widgetId: 'memberSummary', enabled: true, order: 30 },
      ],
    },
  },
  wedding: {
    type: 'wedding',
    label: 'Cưới hỏi',
    modules: [
      { moduleId: 'overview', enabled: true, order: 0, label: 'Tổng quan' },
      { moduleId: 'planning', enabled: true, order: 10, label: 'Công việc' },
      { moduleId: 'finance', enabled: true, order: 20, label: 'Tài chính' },
      { moduleId: 'weddingGuests', enabled: true, order: 30, label: 'Khách mời' },
      { moduleId: 'members', enabled: true, order: 40, label: 'Thành viên' },
    ],
    overview: {
      widgets: [
        { widgetId: 'planSummary', enabled: true, order: 0 },
        { widgetId: 'planningSnapshot', enabled: true, order: 10 },
        { widgetId: 'financeSummary', enabled: true, order: 20 },
        { widgetId: 'weddingGuestSummary', enabled: true, order: 30 },
        { widgetId: 'memberSummary', enabled: true, order: 40 },
      ],
    },
  },
  travel: {
    type: 'travel',
    label: 'Du lịch',
    modules: [
      { moduleId: 'overview', enabled: true, order: 0, label: 'Tổng quan' },
      { moduleId: 'planning', enabled: true, order: 10, label: 'Công việc' },
      { moduleId: 'travelItinerary', enabled: true, order: 20, label: 'Lịch trình' },
      { moduleId: 'finance', enabled: true, order: 30, label: 'Chi phí' },
      { moduleId: 'members', enabled: true, order: 40, label: 'Thành viên' },
    ],
    overview: {
      widgets: [
        { widgetId: 'planSummary', enabled: true, order: 0 },
        { widgetId: 'planningSnapshot', enabled: true, order: 10 },
        { widgetId: 'travelItinerarySummary', enabled: true, order: 20 },
        { widgetId: 'financeSummary', enabled: true, order: 30 },
        { widgetId: 'memberSummary', enabled: true, order: 40 },
      ],
    },
  },
  debt: {
    type: 'debt',
    label: 'Vay & trả',
    modules: [
      { moduleId: 'overview', enabled: true, order: 0, label: 'Tổng quan' },
      { moduleId: 'debtTracking', enabled: true, order: 10, label: 'Khoản vay' },
      { moduleId: 'finance', enabled: true, order: 20, label: 'Dòng tiền' },
    ],
    overview: {
      widgets: [
        { widgetId: 'planSummary', enabled: true, order: 0 },
        { widgetId: 'debtSummary', enabled: true, order: 10 },
        { widgetId: 'financeSummary', enabled: true, order: 20 },
      ],
    },
  },
};

export function isSupportedModularPlanType(planType: PlanType): planType is ModularPlanType {
  return supportedModularPlanTypes.includes(planType as ModularPlanType);
}

export function resolveModularPlanType(planType: PlanType): ModularPlanType {
  if (isSupportedModularPlanType(planType)) {
    return planType;
  }

  return modularPlanTypeFallbackMap[planType] ?? 'general';
}

export function getPlanTypeConfig(planType: PlanType): PlanTypeConfig {
  return planTypeConfigMap[resolveModularPlanType(planType)];
}
