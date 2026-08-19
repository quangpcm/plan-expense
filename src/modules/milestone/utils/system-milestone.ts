import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import { hasPlanModule } from '@/modules/plan/utils/plan-type-config';
import type { PlanDocument, PlanType } from '@/modules/plan/types/plan';

export const SYSTEM_HIDDEN_MILESTONE_TITLE = '__system_hidden_milestone__';

export function isSystemHiddenMilestone(milestone: Pick<MilestoneDocument, 'isSystemHidden'>): boolean {
  return Boolean(milestone.isSystemHidden);
}

export function getVisibleMilestones<T extends Pick<MilestoneDocument, 'isSystemHidden'>>(milestones: T[]): T[] {
  return milestones.filter((milestone) => !isSystemHiddenMilestone(milestone));
}

export function getHiddenSystemMilestone<T extends Pick<MilestoneDocument, 'isSystemHidden'>>(milestones: T[]): T | null {
  return milestones.find((milestone) => isSystemHiddenMilestone(milestone)) ?? null;
}

export function planUsesHiddenMilestone(plan: Pick<PlanDocument, 'planType'> | PlanType): boolean {
  return !hasPlanModule(plan, 'planning') && hasPlanModule(plan, 'finance');
}

export function resolveFinanceMilestoneId(
  plan: Pick<PlanDocument, 'planType'> | PlanType,
  milestones: MilestoneDocument[],
  preferredMilestoneId?: string | null,
): string {
  if (preferredMilestoneId && milestones.some((milestone) => milestone.id === preferredMilestoneId)) {
    return preferredMilestoneId;
  }

  if (planUsesHiddenMilestone(plan)) {
    return getHiddenSystemMilestone(milestones)?.id ?? '';
  }

  return getVisibleMilestones(milestones)[0]?.id ?? milestones[0]?.id ?? '';
}
