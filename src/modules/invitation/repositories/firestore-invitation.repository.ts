'use client';

import { Timestamp, collection, doc, onSnapshot, orderBy, query, writeBatch } from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import type { AuthUser } from '@/modules/auth/types/auth';
import type { InvitationRepository } from '@/modules/invitation/repositories/invitation.repository';
import type {
  CreateInvitationInput,
  InvitationDocument,
} from '@/modules/invitation/types/invitation';
import { mapFirebaseError } from '@/shared/utils/firebase-error';

async function createTokenHash(email: string) {
  const token = `${email.toLowerCase()}-${Date.now()}-${crypto.randomUUID()}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest))
    .map((item) => item.toString(16).padStart(2, '0'))
    .join('');
}

export class FirestoreInvitationRepository implements InvitationRepository {
  watchInvitations(planId: string, callback: (items: InvitationDocument[]) => void, onError?: (error: Error) => void) {
    const invitationsQuery = query(
      collection(getFirebaseFirestore(), 'plans', planId, 'invitations'),
      orderBy('createdAt', 'desc'),
    );

    return onSnapshot(
      invitationsQuery,
      (snapshot) => {
        callback(snapshot.docs.map((item) => item.data() as InvitationDocument));
      },
      (error) => {
        onError?.(mapFirebaseError(error, 'Unable to load invitations.', 'INVITATION_WATCH_FAILED'));
      },
    );
  }

  async createInvitation(planId: string, input: CreateInvitationInput, actor: AuthUser) {
    const db = getFirebaseFirestore();
    const now = Timestamp.now();
    const invitationRef = doc(collection(db, 'plans', planId, 'invitations'));
    const tokenHash = await createTokenHash(input.email);
    const batch = writeBatch(db);

    batch.set(invitationRef, {
      id: invitationRef.id,
      planId,
      email: input.email.toLowerCase(),
      tokenHash,
      role: input.role,
      status: 'pending',
      invitedByUserId: actor.uid,
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      acceptedAt: null,
      acceptedByUserId: null,
      revokedAt: null,
      revokedByUserId: null,
      createdAt: now,
      updatedAt: now,
    });

    await batch.commit();
  }
}
