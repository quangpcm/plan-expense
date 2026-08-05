'use client';

import {
  Timestamp,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import type { AuthUser } from '@/modules/auth/types/auth';
import type { MemberRepository } from '@/modules/member/repositories/member.repository';
import type {
  AddGuestInput,
  PlanMemberDocument,
  UpdateMemberRoleInput,
} from '@/modules/member/types/member';
import { mapFirebaseError } from '@/shared/utils/firebase-error';

export class FirestoreMemberRepository implements MemberRepository {
  watchMembers(planId: string, callback: (members: PlanMemberDocument[]) => void, onError?: (error: Error) => void) {
    const membersQuery = query(
      collection(getFirebaseFirestore(), 'plans', planId, 'members'),
      orderBy('createdAt', 'asc'),
    );

    return onSnapshot(
      membersQuery,
      (snapshot) => {
        callback(snapshot.docs.map((item) => item.data() as PlanMemberDocument));
      },
      (error) => {
        onError?.(mapFirebaseError(error, 'Unable to load plan members.', 'MEMBER_WATCH_FAILED'));
      },
    );
  }

  async addGuest(planId: string, input: AddGuestInput, actor: AuthUser) {
    const db = getFirebaseFirestore();
    const now = Timestamp.now();
    const batch = writeBatch(db);
    const memberRef = doc(collection(db, 'plans', planId, 'members'));
    const planRef = doc(db, 'plans', planId);

    batch.set(memberRef, {
      id: memberRef.id,
      planId,
      memberType: 'guest',
      userId: null,
      email: null,
      nickname: input.nickname,
      avatarUrl: null,
      role: input.role,
      permissions: {
        canEditAllExpenses: false,
      },
      status: 'active',
      invitedAt: null,
      joinedAt: now,
      removedAt: null,
      createdByUserId: actor.uid,
      createdAt: now,
      updatedAt: now,
    });

    batch.update(planRef, {
      memberCount: increment(1),
      updatedAt: now,
    });

    await batch.commit();
  }

  async updateMemberRole(planId: string, input: UpdateMemberRoleInput) {
    await updateDoc(doc(getFirebaseFirestore(), 'plans', planId, 'members', input.memberId), {
      role: input.role,
      permissions: {
        canEditAllExpenses: input.canEditAllExpenses,
      },
      updatedAt: Timestamp.now(),
    });
  }

  async removeMember(planId: string, memberId: string) {
    const db = getFirebaseFirestore();
    const memberRef = doc(db, 'plans', planId, 'members', memberId);
    const planRef = doc(db, 'plans', planId);

    await runTransaction(db, async (transaction) => {
      const memberSnapshot = await transaction.get(memberRef);

      if (!memberSnapshot.exists()) {
        return;
      }

      const member = memberSnapshot.data() as PlanMemberDocument;

      if (member.status === 'removed') {
        return;
      }

      const now = Timestamp.now();

      transaction.update(memberRef, {
        status: 'removed',
        removedAt: now,
        updatedAt: now,
      });

      transaction.update(planRef, {
        memberCount: increment(-1),
        updatedAt: now,
      });
    });
  }
}
