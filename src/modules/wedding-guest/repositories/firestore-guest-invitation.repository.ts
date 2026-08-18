'use client';

import {
  Timestamp,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import type {
  AddGuestInvitationPersistenceInput,
  BulkUpsertGuestInvitationPersistenceInput,
  GuestInvitationRepository,
  UpdateGuestInvitationPersistenceInput,
} from '@/modules/wedding-guest/repositories/guest-invitation.repository';
import type { GuestInvitationDocument } from '@/modules/wedding-guest/types/guest-invitation';
import { AppError } from '@/shared/errors/app-error';
import { mapFirebaseError } from '@/shared/utils/firebase-error';

export class FirestoreGuestInvitationRepository implements GuestInvitationRepository {
  async addInvitation(input: AddGuestInvitationPersistenceInput) {
    const db = getFirebaseFirestore();
    const invitationRef = doc(
      db,
      'plans',
      input.planId,
      'guestInvitations',
      `${input.guestId}_${input.groupId}`,
    );
    const existingSnapshot = await getDoc(invitationRef);

    if (existingSnapshot.exists()) {
      throw new AppError(
        'Khách này đã có trong nhóm này.',
        'GUEST_INVITATION_ALREADY_EXISTS',
        409,
      );
    }

    const now = Timestamp.now();

    await setDoc(invitationRef, {
      id: invitationRef.id,
      planId: input.planId,
      guestId: input.guestId,
      groupId: input.groupId,
      rsvp: input.rsvp,
      attendeeCount: input.attendeeCount,
      moneyGiftAmount: input.moneyGiftAmount,
      goldGiftAmount: input.goldGiftAmount,
      goldGiftNote: input.goldGiftNote,
      note: input.note,
      createdByUserId: input.createdByUserId,
      createdAt: now,
      updatedAt: now,
    } satisfies GuestInvitationDocument);

    return { invitationId: invitationRef.id };
  }

  async bulkUpsertInvitations(
    inputs: BulkUpsertGuestInvitationPersistenceInput,
  ) {
    const db = getFirebaseFirestore();
    let batch = writeBatch(db);
    let operationCount = 0;

    for (const input of inputs) {
      const invitationRef = doc(
        db,
        'plans',
        input.planId,
        'guestInvitations',
        input.mode === 'create'
          ? `${input.guestId}_${input.groupId}`
          : input.invitationId,
      );
      const now = Timestamp.now();

      if (input.mode === 'create') {
        batch.set(invitationRef, {
          id: invitationRef.id,
          planId: input.planId,
          guestId: input.guestId,
          groupId: input.groupId,
          rsvp: input.rsvp,
          attendeeCount: input.attendeeCount,
          moneyGiftAmount: input.moneyGiftAmount,
          goldGiftAmount: input.goldGiftAmount,
          goldGiftNote: input.goldGiftNote,
          note: input.note,
          createdByUserId: input.createdByUserId,
          createdAt: now,
          updatedAt: now,
        } satisfies GuestInvitationDocument);
      } else {
        batch.update(invitationRef, {
          rsvp: input.rsvp,
          attendeeCount: input.attendeeCount,
          moneyGiftAmount: input.moneyGiftAmount,
          goldGiftAmount: input.goldGiftAmount,
          goldGiftNote: input.goldGiftNote,
          note: input.note,
          updatedAt: now,
        });
      }

      operationCount += 1;

      if (operationCount >= 450) {
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }
  }

  async updateInvitation(
    planId: string,
    input: UpdateGuestInvitationPersistenceInput,
  ) {
    const db = getFirebaseFirestore();
    const invitationRef = doc(
      db,
      'plans',
      planId,
      'guestInvitations',
      input.invitationId,
    );

    await writeBatch(db)
      .update(invitationRef, {
        rsvp: input.rsvp,
        attendeeCount: input.attendeeCount,
        moneyGiftAmount: input.moneyGiftAmount,
        goldGiftAmount: input.goldGiftAmount,
        goldGiftNote: input.goldGiftNote,
        note: input.note,
        updatedAt: Timestamp.now(),
      })
      .commit();
  }

  async deleteInvitation(planId: string, invitationId: string) {
    const db = getFirebaseFirestore();

    await writeBatch(db)
      .delete(doc(db, 'plans', planId, 'guestInvitations', invitationId))
      .commit();
  }

  watchInvitations(
    planId: string,
    callback: (invitations: GuestInvitationDocument[]) => void,
    onError?: (error: Error) => void,
  ) {
    const invitationsQuery = query(
      collection(getFirebaseFirestore(), 'plans', planId, 'guestInvitations'),
      orderBy('createdAt', 'asc'),
    );

    return onSnapshot(
      invitationsQuery,
      (snapshot) => {
        callback(
          snapshot.docs.map((item) => item.data() as GuestInvitationDocument),
        );
      },
      (error) => {
        onError?.(
          mapFirebaseError(
            error,
            'Unable to load guest invitations.',
            'GUEST_INVITATION_WATCH_FAILED',
          ),
        );
      },
    );
  }
}
