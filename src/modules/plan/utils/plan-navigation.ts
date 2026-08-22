import { resolveModuleAccess } from '@/modules/member/services/permission.service';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument, PlanType } from '@/modules/plan/types/plan';
import type { ConfigurableModuleId, PlanModuleDefinition, PlanModuleId, PlanModuleRoute } from '@/modules/plan/types/plan-modular';
import { getPlanModuleDefinitions } from '@/modules/plan/utils/plan-type-config';

// 'overview' luôn hiển thị khi module gốc enabled — không có access level
// riêng, tự động filter theo module con (docs/roles-permissions.md #16).
function isModuleVisibleForMember(moduleId: PlanModuleId, member: PlanMemberDocument | null | undefined): boolean {
  if (member === undefined || moduleId === 'overview') {
    return true;
  }

  return resolveModuleAccess(member, moduleId as ConfigurableModuleId) !== 'hidden';
}

export type PlanDetailTabId = PlanModuleId;

export type PlanDetailTabDefinition = {
  id: PlanDetailTabId;
  label: string;
  queryTab: string | null;
  routeKey: string;
};

function getTabAliases(moduleDefinition: PlanModuleDefinition): string[] {
  if (moduleDefinition.id === 'finance') {
    return ['statistic'];
  }

  if (moduleDefinition.id === 'weddingGuests') {
    return ['guests'];
  }

  return [];
}

function extractTabParam(route: PlanModuleRoute): string | null {
  const matched = route.pathname.match(/[?&]tab=([^&]+)/);
  return matched?.[1] ?? null;
}

function getNavigationRoutes(moduleDefinition: PlanModuleDefinition): PlanModuleRoute[] {
  return (moduleDefinition.routes ?? []).filter((route) => {
    if (moduleDefinition.id === 'overview') {
      return route.key === 'overview.home';
    }

    return route.key.includes('.tab');
  });
}

export function getPlanDetailTabs(
  plan: Pick<PlanDocument, 'planType'> | PlanType,
  member?: PlanMemberDocument | null,
): PlanDetailTabDefinition[] {
  return getPlanModuleDefinitions(plan)
    .filter((moduleDefinition) => moduleDefinition.navigation.enabled)
    .filter((moduleDefinition) => isModuleVisibleForMember(moduleDefinition.id, member))
    .flatMap((moduleDefinition) => {
      const navigationRoutes = getNavigationRoutes(moduleDefinition);
      const primaryRoute = navigationRoutes[0];

      if (!primaryRoute) {
        return [];
      }

      return [
        {
          id: moduleDefinition.id,
          label: moduleDefinition.defaultLabel,
          queryTab: extractTabParam(primaryRoute),
          routeKey: primaryRoute.key,
        },
      ];
    });
}

export function resolvePlanDetailTab(
  plan: Pick<PlanDocument, 'planType'> | PlanType,
  tabParam: string | null,
  member?: PlanMemberDocument | null,
): PlanDetailTabId {
  const navigationByTab = new Map<string, PlanDetailTabId>();
  const tabs = getPlanDetailTabs(plan, member);

  for (const tab of tabs) {
    if (tab.queryTab) {
      navigationByTab.set(tab.queryTab, tab.id);
    }

    const moduleDefinition = getPlanModuleDefinitions(plan).find(
      (candidate) => candidate.id === tab.id,
    );

    if (!moduleDefinition) {
      continue;
    }

    for (const alias of getTabAliases(moduleDefinition)) {
      navigationByTab.set(alias, tab.id);
    }

    if (tab.id === 'planning') {
      for (const route of moduleDefinition.routes ?? []) {
        const routeTab = extractTabParam(route);

        if (routeTab) {
          navigationByTab.set(routeTab, tab.id);
        }
      }
    }
  }

  if (tabParam && navigationByTab.has(tabParam)) {
    return navigationByTab.get(tabParam)!;
  }

  return tabs[0]?.id ?? 'overview';
}
