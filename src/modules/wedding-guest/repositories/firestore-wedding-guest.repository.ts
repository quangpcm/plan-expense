'use client';

import {
  Timestamp,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import type {
  CreateWeddingGuestPersistenceInput,
  UpdateWeddingGuestPersistenceInput,
  WeddingGuestRepository,
} from '@/modules/wedding-guest/repositories/wedding-guest.repository';
import type { GuestInvitationDocument } from '@/modules/wedding-guest/types/guest-invitation';
import type { WeddingGuestDocument } from '@/modules/wedding-guest/types/wedding-guest';
import { mapFirebaseError } from '@/shared/utils/firebase-error';

const CHUNK_SIZE = 450;

export class FirestoreWeddingGuestRepository implements WeddingGuestRepository {
  async createGuestWithInvitation(input: CreateWeddingGuestPersistenceInput) {
    const db = getFirebaseFirestore();
    const guestRef = doc(
      collection(db, 'plans', input.planId, 'weddingGuests'),
    );
    const invitationRef = doc(
      db,
      'plans',
      input.planId,
      'guestInvitations',
      `${guestRef.id}_${input.groupId}`,
    );
    const now = Timestamp.now();

    const batch = writeBatch(db);

    batch.set(guestRef, {
      id: guestRef.id,
      planId: input.planId,
      name: input.name,
      normalizedName: input.normalizedName,
      sideId: input.sideId,
      relationshipId: input.relationshipId,
      invitedById: input.invitedById,
      createdByUserId: input.createdByUserId,
      createdAt: now,
      updatedAt: now,
    } satisfies WeddingGuestDocument);

    batch.set(invitationRef, {
      id: invitationRef.id,
      planId: input.planId,
      guestId: guestRef.id,
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

    await batch.commit();

    return { guestId: guestRef.id, invitationId: invitationRef.id };
  }

  async updateGuest(planId: string, input: UpdateWeddingGuestPersistenceInput) {
    const db = getFirebaseFirestore();
    const guestRef = doc(db, 'plans', planId, 'weddingGuests', input.guestId);

    await writeBatch(db)
      .update(guestRef, {
        name: input.name,
        normalizedName: input.normalizedName,
        sideId: input.sideId,
        relationshipId: input.relationshipId,
        invitedById: input.invitedById,
        updatedAt: Timestamp.now(),
      })
      .commit();
  }

  async deleteGuest(planId: string, guestId: string) {
    const db = getFirebaseFirestore();
    const guestRef = doc(db, 'plans', planId, 'weddingGuests', guestId);

    const invitationsSnapshot = await getDocs(
      query(
        collection(db, 'plans', planId, 'guestInvitations'),
        where('guestId', '==', guestId),
      ),
    );

    const refsToDelete = [
      guestRef,
      ...invitationsSnapshot.docs.map((snapshot) => snapshot.ref),
    ];

    for (let index = 0; index < refsToDelete.length; index += CHUNK_SIZE) {
      const batch = writeBatch(db);
      refsToDelete
        .slice(index, index + CHUNK_SIZE)
        .forEach((ref) => batch.delete(ref));
      await batch.commit();
    }
  }

  watchGuests(
    planId: string,
    callback: (guests: WeddingGuestDocument[]) => void,
    onError?: (error: Error) => void,
  ) {
    const guestsQuery = query(
      collection(getFirebaseFirestore(), 'plans', planId, 'weddingGuests'),
      orderBy('createdAt', 'asc'),
    );

    return onSnapshot(
      guestsQuery,
      (snapshot) => {
        callback(
          snapshot.docs.map((item) => item.data() as WeddingGuestDocument),
        );
      },
      (error) => {
        onError?.(
          mapFirebaseError(
            error,
            'Unable to load wedding guests.',
            'WEDDING_GUEST_WATCH_FAILED',
          ),
        );
      },
    );
  }
}
