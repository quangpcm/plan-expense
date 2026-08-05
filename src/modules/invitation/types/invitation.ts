import type { Timestamp } from 'firebase/firestore';

export type InviteRole = 'editor' | 'viewer';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export type InvitationDocument = {
  id: string;
  planId: string;
  email: string | null;
  tokenHash: string;
  role: InviteRole;
  status: InvitationStatus;
  invitedByUserId: string;
  expiresAt: Timestamp;
  acceptedAt: Timestamp | null;
  acceptedByUserId: string | null;
  revokedAt: Timestamp | null;
  revokedByUserId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateInvitationInput = {
  email: string;
  role: InviteRole;
};

