import type { Timestamp } from 'firebase/firestore';

import type { AttachmentDraft, MediaAttachment } from '@/modules/storage/types/attachment';

export type TravelActivityDocument = {
  id: string;
  planId: string;
  title: string;
  locationName: string | null;
  locationMapUrl: string | null;
  note: string | null;
  startsAt: Timestamp;
  endsAt: Timestamp | null;
  participantMemberIds: string[];
  attachments: MediaAttachment[];
  createdByUserId: string;
  createdByMemberId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateTravelActivityInput = {
  title: string;
  locationName?: string | undefined;
  locationMapUrl?: string | undefined;
  note?: string | undefined;
  startsAt: string;
  endsAt?: string | undefined;
  participantMemberIds: string[];
  attachments: AttachmentDraft[];
};

export type UpdateTravelActivityInput = CreateTravelActivityInput & {
  activityId: string;
};
