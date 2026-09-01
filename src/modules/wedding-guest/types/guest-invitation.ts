import type { Timestamp } from 'firebase/firestore';

export type GuestRsvpStatus = 'pending' | 'attending' | 'not_attending';

export type GuestTransportArrangement =
  | 'self_arranged'
  | 'bride_side'
  | 'groom_side'
  | 'undecided';

export type GuestInvitationDocument = {
  id: string;
  planId: string;
  guestId: string;
  groupId: string;
  rsvp: GuestRsvpStatus;
  attendeeCount: number;
  moneyGiftAmount: number | null;
  goldGiftAmount: number | null;
  goldGiftNote: string | null;
  note: string | null;
  transportArrangement: GuestTransportArrangement;
  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type GuestInvitationDetailsInput = {
  rsvp: GuestRsvpStatus;
  attendeeCount: number;
  moneyGiftAmount?: number | undefined;
  goldGiftAmount?: number | undefined;
  goldGiftNote?: string | undefined;
  note?: string | undefined;
  transportArrangement?: GuestTransportArrangement | undefined;
};

export type AddGuestInvitationInput = GuestInvitationDetailsInput & {
  guestId: string;
  groupId: string;
};

export type UpdateGuestInvitationInput = GuestInvitationDetailsInput & {
  invitationId: string;
};
