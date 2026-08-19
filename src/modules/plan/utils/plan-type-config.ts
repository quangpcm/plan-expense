import { planModuleRegistry } from '@/modules/plan/constants/plan-module-registry';
import { getPlanTypeConfig, resolveModularPlanType } from '@/modules/plan/constants/plan-type-config';
import type { PlanDocument, PlanType } from '@/modules/plan/types/plan';
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

export function getModularPlanType(planType: PlanType): ModularPlanType {
  return resolveModularPlanType(planType);
}

export function getResolvedPlanTypeConfig(plan: Pick<PlanDocument, 'planType'> | PlanType): PlanTypeConfig {
  const planType = typeof plan === 'string' ? plan : plan.planType;

  return getPlanTypeConfig(planType);
}

export function getEnabledPlanModules(plan: Pick<PlanDocument, 'planType'> | PlanType): PlanModuleConfig[] {
  return getResolvedPlanTypeConfig(plan)
    .modules
    .filter((moduleConfig) => moduleConfig.enabled)
    .sort((left, right) => left.order - right.order);
}

export function hasPlanModule(
  plan: Pick<PlanDocument, 'planType'> | PlanType,
  moduleId: PlanModuleId,
): boolean {
  return getEnabledPlanModules(plan).some((moduleConfig) => moduleConfig.moduleId === moduleId);
}

export function getPlanModuleDefinition(moduleId: PlanModuleId): PlanModuleDefinition {
  return planModuleRegistry[moduleId];
}

export function getPlanModuleDefinitions(plan: Pick<PlanDocument, 'planType'> | PlanType): PlanModuleDefinition[] {
  return getEnabledPlanModules(plan).map((moduleConfig) => getPlanModuleDefinition(moduleConfig.moduleId));
}

export function getPlanCapabilities(plan: Pick<PlanDocument, 'planType'> | PlanType): PlanCapability[] {
  return getPlanModuleDefinitions(plan).flatMap((moduleDefinition) => moduleDefinition.permissions ?? []);
}

export function getPlanOwnedCollections(plan: Pick<PlanDocument, 'planType'> | PlanType): PlanModuleCollection[] {
  const collectionMap = new Map<string, PlanModuleCollection>();

  [...planCoreCollections, ...getPlanModuleDefinitions(plan).flatMap((moduleDefinition) => moduleDefinition.collections ?? [])]
    .forEach((collectionDefinition) => {
      collectionMap.set(collectionDefinition.path, collectionDefinition);
    });

  return Array.from(collectionMap.values());
}

export function getPlanOwnedCollectionPaths(plan: Pick<PlanDocument, 'planType'> | PlanType): PlanOwnedCollectionPath[] {
  return getPlanOwnedCollections(plan).map(
    (collectionDefinition) => collectionDefinition.path as PlanOwnedCollectionPath,
  );
}

export function getPlanOwnedRoutes(plan: Pick<PlanDocument, 'planType'> | PlanType): PlanModuleRoute[] {
  const routeMap = new Map<string, PlanModuleRoute>();

  getPlanModuleDefinitions(plan)
    .flatMap((moduleDefinition) => moduleDefinition.routes ?? [])
    .forEach((routeDefinition) => {
      routeMap.set(routeDefinition.key, routeDefinition);
    });

  return Array.from(routeMap.values());
}
