import type { Timestamp } from 'firebase/firestore';

import type { PlanType } from '@/modules/plan/types/plan';

export type InviteRole = 'editor' | 'viewer';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export type InvitationDocument = {
  id: string;
  planId: string;
  planName: string;
  planType: PlanType;
  coverImageUrl: string | null;
  email: string | null;
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
  email: string | null;
  role: InviteRole;
};
