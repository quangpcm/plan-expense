import { planModuleRegistry } from '@/modules/plan/constants/plan-module-registry';
import { getPlanTypeConfig, resolveModularPlanType } from '@/modules/plan/constants/plan-type-config';
import type { DebtModel, PlanDocument, PlanType } from '@/modules/plan/types/plan';
import type {
  ModularPlanType,
  PlanCapability,
  PlanModuleCollection,
  PlanModuleConfig,
  PlanModuleDefinition,
  PlanModuleId,
  PlanModuleRoute,
  PlanTypeConfig,
} from '@/modules/plan/types/plan-modular';
import type { PlanOwnedCollectionPath } from '@/modules/plan/utils/plan-ownership';

const planCoreCollections: PlanModuleCollection[] = [
  { path: 'members' },
  { path: 'invitations' },
];

type PlanTypeConfigInput = Pick<PlanDocument, 'planType' | 'debtModel'> | PlanType;

export function getModularPlanType(planType: PlanType): ModularPlanType {
  return resolveModularPlanType(planType);
}

// Plan debt cũ không có `debtModel` -> hiểu là 'finance_aggregate' (docs/debt-plan-specs.md #25).
export function resolvePlanDebtModel(plan: PlanTypeConfigInput): DebtModel {
  if (typeof plan === 'string') {
    return 'finance_aggregate';
  }

  return plan.debtModel ?? 'finance_aggregate';
}

export function getResolvedPlanTypeConfig(plan: PlanTypeConfigInput): PlanTypeConfig {
  const planType = typeof plan === 'string' ? plan : plan.planType;

  return getPlanTypeConfig(planType, resolvePlanDebtModel(plan));
}

export function getEnabledPlanModules(plan: PlanTypeConfigInput): PlanModuleConfig[] {
  return getResolvedPlanTypeConfig(plan)
    .modules
    .filter((moduleConfig) => moduleConfig.enabled)
    .sort((left, right) => left.order - right.order);
}

export function hasPlanModule(
  plan: PlanTypeConfigInput,
  moduleId: PlanModuleId,
): boolean {
  return getEnabledPlanModules(plan).some((moduleConfig) => moduleConfig.moduleId === moduleId);
}

export function getPlanModuleDefinition(moduleId: PlanModuleId): PlanModuleDefinition {
  return planModuleRegistry[moduleId];
}

export function getPlanModuleDefinitions(plan: PlanTypeConfigInput): PlanModuleDefinition[] {
  return getEnabledPlanModules(plan).map((moduleConfig) => getPlanModuleDefinition(moduleConfig.moduleId));
}

export function getPlanCapabilities(plan: PlanTypeConfigInput): PlanCapability[] {
  return getPlanModuleDefinitions(plan).flatMap((moduleDefinition) => moduleDefinition.permissions ?? []);
}

export function getPlanOwnedCollections(plan: PlanTypeConfigInput): PlanModuleCollection[] {
  const collectionMap = new Map<string, PlanModuleCollection>();

  [...planCoreCollections, ...getPlanModuleDefinitions(plan).flatMap((moduleDefinition) => moduleDefinition.collections ?? [])]
    .forEach((collectionDefinition) => {
      collectionMap.set(collectionDefinition.path, collectionDefinition);
    });

  return Array.from(collectionMap.values());
}

export function getPlanOwnedCollectionPaths(plan: PlanTypeConfigInput): PlanOwnedCollectionPath[] {
  return getPlanOwnedCollections(plan).map(
    (collectionDefinition) => collectionDefinition.path as PlanOwnedCollectionPath,
  );
}

export function getPlanOwnedRoutes(plan: PlanTypeConfigInput): PlanModuleRoute[] {
  const routeMap = new Map<string, PlanModuleRoute>();

  getPlanModuleDefinitions(plan)
    .flatMap((moduleDefinition) => moduleDefinition.routes ?? [])
    .forEach((routeDefinition) => {
      routeMap.set(routeDefinition.key, routeDefinition);
    });

  return Array.from(routeMap.values());
}
