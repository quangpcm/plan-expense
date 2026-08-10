'use client';

import {
  Timestamp,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import type { AuthUser } from '@/modules/auth/types/auth';
import type {
  CreateInvitationPersistenceInput,
  InvitationRepository,
} from '@/modules/invitation/repositories/invitation.repository';
import type { InvitationDocument } from '@/modules/invitation/types/invitation';
import { mapFirebaseError } from '@/shared/utils/firebase-error';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

  async getInvitation(planId: string, invitationId: string) {
    const snapshot = await getDoc(doc(getFirebaseFirestore(), 'plans', planId, 'invitations', invitationId));
    return snapshot.exists() ? (snapshot.data() as InvitationDocument) : null;
  }

  async createInvitation(input: CreateInvitationPersistenceInput, actor: AuthUser) {
    const db = getFirebaseFirestore();
    const now = Timestamp.now();
    const invitationRef = doc(collection(db, 'plans', input.planId, 'invitations'));

    await writeBatch(db)
      .set(invitationRef, {
        id: invitationRef.id,
        planId: input.planId,
        planName: input.planName,
        planType: input.planType,
        coverImageUrl: input.coverImageUrl,
        email: input.email ? input.email.toLowerCase() : null,
        role: input.role,
        status: 'pending',
        invitedByUserId: actor.uid,
        expiresAt: Timestamp.fromDate(new Date(Date.now() + INVITATION_TTL_MS)),
        acceptedAt: null,
        acceptedByUserId: null,
        revokedAt: null,
        revokedByUserId: null,
        createdAt: now,
        updatedAt: now,
      })
      .commit();

    return { invitationId: invitationRef.id };
  }

  async acceptInvitation(planId: string, invitationId: string, actor: AuthUser) {
    const db = getFirebaseFirestore();
    const invitationRef = doc(db, 'plans', planId, 'invitations', invitationId);
    const invitationSnapshot = await getDoc(invitationRef);

    if (!invitationSnapshot.exists()) {
      throw new Error('This invitation no longer exists.');
    }

    const invitation = invitationSnapshot.data() as InvitationDocument;
    const memberRef = doc(collection(db, 'plans', planId, 'members'));
    const userPlanRef = doc(db, 'userPlans', actor.uid, 'plans', planId);
    const now = Timestamp.now();
    const batch = writeBatch(db);

    batch.set(memberRef, {
      id: memberRef.id,
      planId,
      memberType: 'registered',
      userId: actor.uid,
      email: actor.email,
      nickname: actor.displayName?.trim() || actor.email?.split('@')[0] || 'Member',
      nicknameIsCustom: false,
      invitationId,
      avatarUrl: actor.photoURL,
      role: invitation.role,
      permissions: { canEditAllExpenses: false },
      status: 'active',
      invitedAt: null,
      joinedAt: now,
      removedAt: null,
      createdByUserId: actor.uid,
      createdAt: now,
      updatedAt: now,
    });

    batch.set(userPlanRef, {
      id: planId,
      planId,
      userId: actor.uid,
      planName: invitation.planName,
      planType: invitation.planType,
      role: invitation.role,
      memberId: memberRef.id,
      memberStatus: 'active',
      planStatus: 'active',
      coverImageUrl: invitation.coverImageUrl,
      totalExpense: 0,
      memberCount: 1,
      joinedAt: now,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });

    batch.update(invitationRef, {
      status: 'accepted',
      acceptedAt: now,
      acceptedByUserId: actor.uid,
      updatedAt: now,
    });

    await batch.commit();

    // Best-effort self-correction: totalExpense/memberCount on the new userPlans
    // doc are placeholders (a brand-new member can't read plans/{planId} before
    // joining). Now that they're a visible member, refresh both to the real
    // values via the same "any visible member may push these two absolute
    // aggregate fields" rule already used elsewhere — never blocks a successful
    // join if this secondary step fails.
    try {
      const planSnapshot = await getDoc(doc(db, 'plans', planId));

      if (planSnapshot.exists()) {
        const plan = planSnapshot.data() as { totalExpense: number; memberCount: number };

        await updateDoc(userPlanRef, {
          totalExpense: plan.totalExpense,
          memberCount: plan.memberCount + 1,
          updatedAt: Timestamp.now(),
        });
        await updateDoc(doc(db, 'plans', planId), {
          memberCount: increment(1),
          updatedAt: Timestamp.now(),
        });
      }
    } catch {
      // Non-critical — the next expense/member mutation on this plan will
      // self-heal these two fields for every member anyway.
    }
  }

  async revokeInvitation(planId: string, invitationId: string, actor: AuthUser) {
    await updateDoc(doc(getFirebaseFirestore(), 'plans', planId, 'invitations', invitationId), {
      status: 'revoked',
      revokedAt: Timestamp.now(),
      revokedByUserId: actor.uid,
      updatedAt: Timestamp.now(),
    });
  }
}
