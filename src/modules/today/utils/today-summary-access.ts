import { resolvePlanCapabilities } from '@/modules/member/services/permission.service';
import type { PlanMemberDocument } from '@/modules/member/types/member';

export type TodayAccessibleModules = {
  canViewTodo: boolean;
  canViewTravelActivity: boolean;
};

// Reuses the existing capability model (permission.service.ts) — Today never
// recreates or denormalizes permission rules of its own.
export function resolveTodayAccessibleModules(member: PlanMemberDocument | null): TodayAccessibleModules {
  const capabilities = resolvePlanCapabilities(member);

  return {
    canViewTodo: capabilities.includes('planning.view'),
    canViewTravelActivity: capabilities.includes('travelItinerary.view'),
  };
}
