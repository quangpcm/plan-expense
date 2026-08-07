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
  UpdateMemberInput,
} from '@/modules/member/types/member';
import { syncUserPlansAggregate } from '@/shared/lib/firestore/sync-user-plans';
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
    await syncUserPlansAggregate(planId, { memberCount: increment(1) });
  }

  async updateMember(planId: string, input: UpdateMemberInput) {
    await updateDoc(doc(getFirebaseFirestore(), 'plans', planId, 'members', input.memberId), {
      nickname: input.nickname,
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

    const didRemove = await runTransaction(db, async (transaction) => {
      const memberSnapshot = await transaction.get(memberRef);

      if (!memberSnapshot.exists()) {
        return false;
      }

      const member = memberSnapshot.data() as PlanMemberDocument;

      if (member.status === 'removed') {
        return false;
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

      return true;
    });

    if (didRemove) {
      await syncUserPlansAggregate(planId, { memberCount: increment(-1) });
    }
  }

  async reactivateMember(planId: string, memberId: string) {
    const db = getFirebaseFirestore();
    const memberRef = doc(db, 'plans', planId, 'members', memberId);
    const planRef = doc(db, 'plans', planId);

    const didReactivate = await runTransaction(db, async (transaction) => {
      const memberSnapshot = await transaction.get(memberRef);

      if (!memberSnapshot.exists()) {
        return false;
      }

      const member = memberSnapshot.data() as PlanMemberDocument;

      if (member.status !== 'removed') {
        return false;
      }

      const now = Timestamp.now();

      transaction.update(memberRef, {
        status: 'active',
        removedAt: null,
        updatedAt: now,
      });

      transaction.update(planRef, {
        memberCount: increment(1),
        updatedAt: now,
      });

      return true;
    });

    if (didReactivate) {
      await syncUserPlansAggregate(planId, { memberCount: increment(1) });
    }
  }

  async deleteMember(planId: string, memberId: string) {
    const db = getFirebaseFirestore();
    const memberRef = doc(db, 'plans', planId, 'members', memberId);
    const planRef = doc(db, 'plans', planId);

    const wasActive = await runTransaction(db, async (transaction) => {
      const memberSnapshot = await transaction.get(memberRef);

      if (!memberSnapshot.exists()) {
        return false;
      }

      const member = memberSnapshot.data() as PlanMemberDocument;
      const now = Timestamp.now();

      transaction.delete(memberRef);

      transaction.update(planRef, {
        ...(member.status === 'active' ? { memberCount: increment(-1) } : {}),
        updatedAt: now,
      });

      if (member.memberType === 'registered' && member.userId) {
        transaction.delete(doc(db, 'userPlans', member.userId, 'plans', planId));
      }

      return member.status === 'active';
    });

    if (wasActive) {
      await syncUserPlansAggregate(planId, { memberCount: increment(-1) });
    }
  }
}
