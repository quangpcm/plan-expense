import type { Timestamp } from 'firebase/firestore';

import type { GuestTransportArrangement } from '@/modules/wedding-guest/types/guest-invitation';

export type WeddingGuestSideId = 'bride_family' | 'groom_family' | 'shared';

export type WeddingGuestRelationshipId =
  'family' | 'friend' | 'colleague' | 'neighbor' | 'partner_client' | 'other';

export type WeddingGuestInvitedById =
  'bride' | 'groom' | 'bride_parents' | 'groom_parents' | 'shared';

export type WeddingGuestDocument = {
  id: string;
  planId: string;
  name: string;
  normalizedName: string;
  sideId: WeddingGuestSideId;
  relationshipId: WeddingGuestRelationshipId;
  invitedById: WeddingGuestInvitedById;
  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type WeddingGuestIdentityInput = {
  name: string;
  sideId: WeddingGuestSideId;
  relationshipId: WeddingGuestRelationshipId;
  invitedById: WeddingGuestInvitedById;
};

export type CreateWeddingGuestInput = WeddingGuestIdentityInput & {
  groupId: string;
  rsvp?: 'pending' | 'attending' | 'not_attending' | undefined;
  attendeeCount?: number | undefined;
  moneyGiftAmount?: number | undefined;
  goldGiftAmount?: number | undefined;
  goldGiftNote?: string | undefined;
  note?: string | undefined;
  transportArrangement?: GuestTransportArrangement | undefined;
};

export type UpdateWeddingGuestInput = WeddingGuestIdentityInput & {
  guestId: string;
};
