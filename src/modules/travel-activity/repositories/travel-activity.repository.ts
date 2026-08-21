import type {
  CreateTravelActivityInput,
  TravelActivityDocument,
  UpdateTravelActivityInput,
} from '@/modules/travel-activity/types/travel-activity';

export type CreateTravelActivityPersistenceInput = Omit<CreateTravelActivityInput, 'attachments'> & {
  planId: string;
  activityId: string;
  createdByUserId: string;
  createdByMemberId: string;
  attachments: TravelActivityDocument['attachments'];
};

export type UpdateTravelActivityPersistenceInput = Omit<UpdateTravelActivityInput, 'attachments'> & {
  attachments: TravelActivityDocument['attachments'];
};

export interface TravelActivityRepository {
  generateActivityId(planId: string): string;
  createActivity(input: CreateTravelActivityPersistenceInput): Promise<{ activityId: string }>;
  updateActivity(
    planId: string,
    input: UpdateTravelActivityPersistenceInput,
  ): Promise<{ orphanedAttachments: TravelActivityDocument['attachments'] }>;
  deleteActivity(
    planId: string,
    activityId: string,
  ): Promise<{ orphanedAttachments: TravelActivityDocument['attachments'] }>;
  watchActivities(
    planId: string,
    callback: (activities: TravelActivityDocument[]) => void,
    onError?: (error: Error) => void,
  ): () => void;
}
