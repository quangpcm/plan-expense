import type {
  GuestInvitationDocument,
  GuestRsvpStatus,
} from '@/modules/wedding-guest/types/guest-invitation';

export type AddGuestInvitationPersistenceInput = {
  planId: string;
  guestId: string;
  groupId: string;
  rsvp: GuestRsvpStatus;
  attendeeCount: number;
  moneyGiftAmount: number | null;
  goldGiftAmount: number | null;
  goldGiftNote: string | null;
  note: string | null;
  createdByUserId: string;
};

export type UpdateGuestInvitationPersistenceInput = {
  invitationId: string;
  rsvp: GuestRsvpStatus;
  attendeeCount: number;
  moneyGiftAmount: number | null;
  goldGiftAmount: number | null;
  goldGiftNote: string | null;
  note: string | null;
};

export type BulkUpsertGuestInvitationPersistenceInput = Array<
  | (AddGuestInvitationPersistenceInput & { mode: 'create' })
  | (Omit<AddGuestInvitationPersistenceInput, 'createdByUserId'> &
      UpdateGuestInvitationPersistenceInput & { mode: 'sync' })
>;

export interface GuestInvitationRepository {
  addInvitation(
    input: AddGuestInvitationPersistenceInput,
  ): Promise<{ invitationId: string }>;
  bulkUpsertInvitations(
    inputs: BulkUpsertGuestInvitationPersistenceInput,
  ): Promise<void>;
  updateInvitation(
    planId: string,
    input: UpdateGuestInvitationPersistenceInput,
  ): Promise<void>;
  deleteInvitation(planId: string, invitationId: string): Promise<void>;
  watchInvitations(
    planId: string,
    callback: (invitations: GuestInvitationDocument[]) => void,
    onError?: (error: Error) => void,
  ): () => void;
}
