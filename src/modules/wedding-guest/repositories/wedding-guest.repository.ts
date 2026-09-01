import type {
  GuestRsvpStatus,
  GuestTransportArrangement,
} from '@/modules/wedding-guest/types/guest-invitation';
import type {
  WeddingGuestDocument,
  WeddingGuestInvitedById,
  WeddingGuestRelationshipId,
  WeddingGuestSideId,
} from '@/modules/wedding-guest/types/wedding-guest';

export type CreateWeddingGuestPersistenceInput = {
  planId: string;
  name: string;
  normalizedName: string;
  sideId: WeddingGuestSideId;
  relationshipId: WeddingGuestRelationshipId;
  invitedById: WeddingGuestInvitedById;
  groupId: string;
  rsvp: GuestRsvpStatus;
  attendeeCount: number;
  moneyGiftAmount: number | null;
  goldGiftAmount: number | null;
  goldGiftNote: string | null;
  note: string | null;
  transportArrangement: GuestTransportArrangement;
  createdByUserId: string;
};

export type CreateWeddingGuestInvitationPersistenceInput = Omit<
  CreateWeddingGuestPersistenceInput,
  | 'name'
  | 'normalizedName'
  | 'sideId'
  | 'relationshipId'
  | 'invitedById'
  | 'createdByUserId'
>;

export type BulkCreateWeddingGuestWithInvitationPersistenceInput = Array<{
  planId: string;
  name: string;
  normalizedName: string;
  sideId: WeddingGuestSideId;
  relationshipId: WeddingGuestRelationshipId;
  invitedById: WeddingGuestInvitedById;
  createdByUserId: string;
  invitations: CreateWeddingGuestInvitationPersistenceInput[];
}>;

export type UpdateWeddingGuestPersistenceInput = {
  guestId: string;
  name: string;
  normalizedName: string;
  sideId: WeddingGuestSideId;
  relationshipId: WeddingGuestRelationshipId;
  invitedById: WeddingGuestInvitedById;
};

export interface WeddingGuestRepository {
  createGuestWithInvitation(
    input: CreateWeddingGuestPersistenceInput,
  ): Promise<{ guestId: string; invitationId: string }>;
  bulkCreateGuestsWithInvitations(
    inputs: BulkCreateWeddingGuestWithInvitationPersistenceInput,
  ): Promise<Array<{ guestId: string; invitationId: string }>>;
  updateGuest(
    planId: string,
    input: UpdateWeddingGuestPersistenceInput,
  ): Promise<void>;
  deleteGuest(planId: string, guestId: string): Promise<void>;
  watchGuests(
    planId: string,
    callback: (guests: WeddingGuestDocument[]) => void,
    onError?: (error: Error) => void,
  ): () => void;
}
