'use client';

import {
  Timestamp,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import { getPlanCollectionRef, getPlanDocumentRef, queryByPlanCollection } from '@/modules/plan';
import type {
  BulkCreateWeddingGuestWithInvitationPersistenceInput,
  CreateWeddingGuestPersistenceInput,
  UpdateWeddingGuestPersistenceInput,
  WeddingGuestRepository,
} from '@/modules/wedding-guest/repositories/wedding-guest.repository';
import type { GuestInvitationDocument } from '@/modules/wedding-guest/types/guest-invitation';
import type { WeddingGuestDocument } from '@/modules/wedding-guest/types/wedding-guest';
import { mapFirebaseError } from '@/shared/utils/firebase-error';

const CHUNK_SIZE = 450;

export class FirestoreWeddingGuestRepository implements WeddingGuestRepository {
  private buildGuestAndInvitationDocs(
    input: Omit<CreateWeddingGuestPersistenceInput, 'groupId' | 'rsvp' | 'attendeeCount' | 'moneyGiftAmount' | 'goldGiftAmount' | 'goldGiftNote' | 'note'> & {
      groupId: string;
      rsvp: CreateWeddingGuestPersistenceInput['rsvp'];
      attendeeCount: number;
      moneyGiftAmount: number | null;
      goldGiftAmount: number | null;
      goldGiftNote: string | null;
      note: string | null;
    },
    guestId?: string,
  ) {
    const db = getFirebaseFirestore();
    const guestRef = guestId
      ? getPlanDocumentRef(db, input.planId, 'weddingGuests', guestId)
      : doc(getPlanCollectionRef(db, input.planId, 'weddingGuests'));
    const invitationRef = getPlanDocumentRef(
      db,
      input.planId,
      'guestInvitations',
      `${guestRef.id}_${input.groupId}`,
    );
    const now = Timestamp.now();

    return {
      guestRef,
      invitationRef,
      guestData: {
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
      } satisfies WeddingGuestDocument,
      invitationData: {
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
      } satisfies GuestInvitationDocument,
    };
  }

  async createGuestWithInvitation(input: CreateWeddingGuestPersistenceInput) {
    const db = getFirebaseFirestore();
    const { guestRef, invitationRef, guestData, invitationData } =
      this.buildGuestAndInvitationDocs(input);

    console.debug('[wedding-guest] createGuestWithInvitation: writing batch', {
      planId: input.planId,
      guestId: guestRef.id,
      invitationId: invitationRef.id,
      groupId: input.groupId,
      guestData,
      invitationData,
    });

    const batch = writeBatch(db);
    batch.set(guestRef, guestData);
    batch.set(invitationRef, invitationData);

    try {
      await batch.commit();
    } catch (error) {
      console.error('[wedding-guest] createGuestWithInvitation: batch.commit failed', {
        planId: input.planId,
        guestId: guestRef.id,
        invitationId: invitationRef.id,
        groupId: input.groupId,
        errorCode: (error as { code?: string })?.code,
        errorMessage: (error as { message?: string })?.message,
        error,
      });
      throw error;
    }

    return { guestId: guestRef.id, invitationId: invitationRef.id };
  }

  async bulkCreateGuestsWithInvitations(
    inputs: BulkCreateWeddingGuestWithInvitationPersistenceInput,
  ) {
    const db = getFirebaseFirestore();
    const results: Array<{ guestId: string; invitationId: string }> = [];
    let batch = writeBatch(db);
    let operationCount = 0;

    const commitBatch = async (context: Record<string, unknown>) => {
      try {
        await batch.commit();
      } catch (error) {
        console.error('[wedding-guest] bulkCreateGuestsWithInvitations: batch.commit failed', {
          ...context,
          errorCode: (error as { code?: string })?.code,
          errorMessage: (error as { message?: string })?.message,
          error,
        });
        throw error;
      }
    };

    for (const input of inputs) {
      const guestRef = doc(getPlanCollectionRef(db, input.planId, 'weddingGuests'));
      const now = Timestamp.now();

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
      operationCount += 1;

      for (const invitation of input.invitations) {
        const invitationRef = getPlanDocumentRef(
          db,
          input.planId,
          'guestInvitations',
          `${guestRef.id}_${invitation.groupId}`,
        );

        batch.set(invitationRef, {
          id: invitationRef.id,
          planId: input.planId,
          guestId: guestRef.id,
          groupId: invitation.groupId,
          rsvp: invitation.rsvp,
          attendeeCount: invitation.attendeeCount,
          moneyGiftAmount: invitation.moneyGiftAmount,
          goldGiftAmount: invitation.goldGiftAmount,
          goldGiftNote: invitation.goldGiftNote,
          note: invitation.note,
          createdByUserId: input.createdByUserId,
          createdAt: now,
          updatedAt: now,
        } satisfies GuestInvitationDocument);
        operationCount += 1;
        results.push({ guestId: guestRef.id, invitationId: invitationRef.id });

        if (operationCount >= CHUNK_SIZE) {
          await commitBatch({ planId: input.planId, guestId: guestRef.id, invitationId: invitationRef.id });
          batch = writeBatch(db);
          operationCount = 0;
        }
      }

      if (operationCount >= CHUNK_SIZE) {
        await commitBatch({ planId: input.planId, guestId: guestRef.id });
        batch = writeBatch(db);
        operationCount = 0;
      }
    }

    if (operationCount > 0) {
      await commitBatch({ planId: inputs[0]?.planId, guestCount: inputs.length });
    }

    return results;
  }

  async updateGuest(planId: string, input: UpdateWeddingGuestPersistenceInput) {
    const db = getFirebaseFirestore();
    const guestRef = getPlanDocumentRef(db, planId, 'weddingGuests', input.guestId);

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
    const guestRef = getPlanDocumentRef(db, planId, 'weddingGuests', guestId);

    const invitationsSnapshot = await getDocs(
      queryByPlanCollection(db, planId, 'guestInvitations', where('guestId', '==', guestId)),
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
      getPlanCollectionRef(getFirebaseFirestore(), planId, 'weddingGuests'),
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
