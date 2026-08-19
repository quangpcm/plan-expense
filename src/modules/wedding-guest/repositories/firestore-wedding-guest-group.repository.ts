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
  CreateWeddingGuestGroupPersistenceInput,
  UpdateWeddingGuestGroupPersistenceInput,
  WeddingGuestGroupRepository,
} from '@/modules/wedding-guest/repositories/wedding-guest-group.repository';
import type { WeddingGuestGroupDocument } from '@/modules/wedding-guest/types/wedding-guest-group';
import { mapFirebaseError } from '@/shared/utils/firebase-error';

const CHUNK_SIZE = 450;

export class FirestoreWeddingGuestGroupRepository implements WeddingGuestGroupRepository {
  async createGroup(input: CreateWeddingGuestGroupPersistenceInput) {
    const db = getFirebaseFirestore();
    const groupRef = doc(getPlanCollectionRef(db, input.planId, 'weddingGuestGroups'));
    const now = Timestamp.now();

    await writeBatch(db)
      .set(groupRef, {
        id: groupRef.id,
        planId: input.planId,
        name: input.name,
        createdByUserId: input.createdByUserId,
        createdAt: now,
        updatedAt: now,
      } satisfies WeddingGuestGroupDocument)
      .commit();

    return { groupId: groupRef.id };
  }

  async updateGroup(
    planId: string,
    input: UpdateWeddingGuestGroupPersistenceInput,
  ) {
    const db = getFirebaseFirestore();
    const groupRef = getPlanDocumentRef(db, planId, 'weddingGuestGroups', input.groupId);

    await writeBatch(db)
      .update(groupRef, {
        name: input.name,
        updatedAt: Timestamp.now(),
      })
      .commit();
  }

  async deleteGroup(planId: string, groupId: string) {
    const db = getFirebaseFirestore();
    const groupRef = getPlanDocumentRef(db, planId, 'weddingGuestGroups', groupId);

    const invitationsSnapshot = await getDocs(
      queryByPlanCollection(db, planId, 'guestInvitations', where('groupId', '==', groupId)),
    );

    const refsToDelete = [
      groupRef,
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

  watchGroups(
    planId: string,
    callback: (groups: WeddingGuestGroupDocument[]) => void,
    onError?: (error: Error) => void,
  ) {
    const groupsQuery = query(
      getPlanCollectionRef(getFirebaseFirestore(), planId, 'weddingGuestGroups'),
      orderBy('createdAt', 'asc'),
    );

    return onSnapshot(
      groupsQuery,
      (snapshot) => {
        callback(
          snapshot.docs.map((item) => item.data() as WeddingGuestGroupDocument),
        );
      },
      (error) => {
        onError?.(
          mapFirebaseError(
            error,
            'Unable to load wedding guest groups.',
            'WEDDING_GUEST_GROUP_WATCH_FAILED',
          ),
        );
      },
    );
  }
}
