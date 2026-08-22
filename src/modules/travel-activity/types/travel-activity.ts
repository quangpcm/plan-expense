import type { Timestamp } from 'firebase/firestore';

import type { AttachmentDraft, MediaAttachment } from '@/modules/storage/types/attachment';

export type TravelActivityCategory =
  | 'transport'
  | 'stay'
  | 'food'
  | 'sightseeing'
  | 'activity'
  | 'shopping'
  | 'other';

export type TravelActivityDocument = {
  id: string;
  planId: string;
  title: string;
  category: TravelActivityCategory;
  locationName: string | null;
  locationMapUrl: string | null;
  note: string | null;
  startsAt: Timestamp;
  endsAt: Timestamp | null;
  attachments: MediaAttachment[];
  createdByUserId: string;
  createdByMemberId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateTravelActivityInput = {
  title: string;
  category: TravelActivityCategory;
  locationName?: string | undefined;
  locationMapUrl?: string | undefined;
  note?: string | undefined;
  startsAt: string;
  endsAt?: string | undefined;
  attachments: AttachmentDraft[];
};

export type UpdateTravelActivityInput = CreateTravelActivityInput & {
  activityId: string;
};
