import type { GuestRsvpStatus } from '@/modules/wedding-guest/types/guest-invitation';
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
  createdByUserId: string;
};

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
