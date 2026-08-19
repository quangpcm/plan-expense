import type {
  CreateTravelActivityInput,
  TravelActivityDocument,
  UpdateTravelActivityInput,
} from '@/modules/travel-activity/types/travel-activity';

export type CreateTravelActivityPersistenceInput = CreateTravelActivityInput & {
  planId: string;
  activityId: string;
  createdByUserId: string;
  createdByMemberId: string;
};

export type UpdateTravelActivityPersistenceInput = UpdateTravelActivityInput;

export interface TravelActivityRepository {
  generateActivityId(planId: string): string;
  createActivity(input: CreateTravelActivityPersistenceInput): Promise<{ activityId: string }>;
  updateActivity(planId: string, input: UpdateTravelActivityPersistenceInput): Promise<void>;
  deleteActivity(planId: string, activityId: string): Promise<void>;
  watchActivities(
    planId: string,
    callback: (activities: TravelActivityDocument[]) => void,
    onError?: (error: Error) => void,
  ): () => void;
}
