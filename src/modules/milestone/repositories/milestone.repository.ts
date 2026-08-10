import type { MilestoneDocument, ReorderMilestoneInput, UpdateMilestoneInput } from '@/modules/milestone/types/milestone';

export type CreateMilestonePersistenceInput = {
  planId: string;
  orderIndex: number;
  title: string;
  description: string | null;
  iconId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  budgetAmount: number | null;
  createdByUserId: string;
};

export interface MilestoneRepository {
  createMilestone(input: CreateMilestonePersistenceInput): Promise<{ milestoneId: string }>;
  updateMilestone(planId: string, input: UpdateMilestoneInput): Promise<void>;
  reorderMilestones(planId: string, input: ReorderMilestoneInput[]): Promise<void>;
  watchMilestones(
    planId: string,
    callback: (milestones: MilestoneDocument[]) => void,
    onError?: (error: Error) => void,
  ): () => void;
  watchMilestone(
    planId: string,
    milestoneId: string,
    callback: (milestone: MilestoneDocument | null) => void,
    onError?: (error: Error) => void,
  ): () => void;
}
