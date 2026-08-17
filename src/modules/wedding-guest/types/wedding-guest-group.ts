import type { Timestamp } from 'firebase/firestore';

export type WeddingGuestGroupDocument = {
  id: string;
  planId: string;
  name: string;
  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateWeddingGuestGroupInput = {
  name: string;
};

export type UpdateWeddingGuestGroupInput = {
  groupId: string;
  name: string;
};
