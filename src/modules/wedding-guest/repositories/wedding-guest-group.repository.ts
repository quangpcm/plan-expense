import type { WeddingGuestGroupDocument } from '@/modules/wedding-guest/types/wedding-guest-group';

export type CreateWeddingGuestGroupPersistenceInput = {
  planId: string;
  name: string;
  createdByUserId: string;
};

export type UpdateWeddingGuestGroupPersistenceInput = {
  groupId: string;
  name: string;
};

export interface WeddingGuestGroupRepository {
  createGroup(
    input: CreateWeddingGuestGroupPersistenceInput,
  ): Promise<{ groupId: string }>;
  updateGroup(
    planId: string,
    input: UpdateWeddingGuestGroupPersistenceInput,
  ): Promise<void>;
  deleteGroup(planId: string, groupId: string): Promise<void>;
  watchGroups(
    planId: string,
    callback: (groups: WeddingGuestGroupDocument[]) => void,
    onError?: (error: Error) => void,
  ): () => void;
}
