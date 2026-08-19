import type { Timestamp } from 'firebase/firestore';

export type TravelActivityDocument = {
  id: string;
  planId: string;
  title: string;
  locationName: string | null;
  note: string | null;
  startsAt: Timestamp;
  endsAt: Timestamp | null;
  participantMemberIds: string[];
  createdByUserId: string;
  createdByMemberId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateTravelActivityInput = {
  title: string;
  locationName?: string | undefined;
  note?: string | undefined;
  startsAt: string;
  endsAt?: string | undefined;
  participantMemberIds: string[];
};

export type UpdateTravelActivityInput = CreateTravelActivityInput & {
  activityId: string;
};
