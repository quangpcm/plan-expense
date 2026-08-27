'use client';

import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
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
import { getPlanCollectionRef, getPlanDocumentRef } from '@/modules/plan';
import type {
  AddGuestInput,
  PlanMemberDocument,
  UpdateMemberAvatarInput,
  UpdateMemberInput,
} from '@/modules/member/types/member';
import { syncPlanMemberCountAggregate } from '@/shared/lib/firestore/sync-user-plans';
import { mapFirebaseError } from '@/shared/utils/firebase-error';

export class FirestoreMemberRepository implements MemberRepository {
  watchMembers(planId: string, callback: (members: PlanMemberDocument[]) => void, onError?: (error: Error) => void) {
    const membersQuery = query(
      getPlanCollectionRef(getFirebaseFirestore(), planId, 'members'),
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

  async getMember(planId: string, memberId: string) {
    const snapshot = await getDoc(getPlanDocumentRef(getFirebaseFirestore(), planId, 'members', memberId));

    return snapshot.exists() ? (snapshot.data() as PlanMemberDocument) : null;
  }

  async addGuest(planId: string, input: AddGuestInput, actor: AuthUser) {
    const db = getFirebaseFirestore();
    const now = Timestamp.now();
    const batch = writeBatch(db);
    const memberRef = doc(getPlanCollectionRef(db, planId, 'members'));
    const member: PlanMemberDocument = {
      id: memberRef.id,
      planId,
      memberType: 'guest',
      userId: null,
      email: null,
      nickname: input.nickname,
      nicknameIsCustom: true,
      invitationId: null,
      avatarUrl: null,
      role: input.role,
      permissions: {
        moduleAccess: {},
      },
      status: 'active',
      invitedAt: null,
      joinedAt: now,
      removedAt: null,
      createdByUserId: actor.uid,
      createdAt: now,
      updatedAt: now,
    };

    batch.set(memberRef, member);

    await batch.commit();
    await syncPlanMemberCountAggregate(planId, now);

    return member;
  }

  async updateMember(planId: string, input: UpdateMemberInput) {
    await updateDoc(getPlanDocumentRef(getFirebaseFirestore(), planId, 'members', input.memberId), {
      nickname: input.nickname,
      nicknameIsCustom: true,
      role: input.role,
      permissions: {
        moduleAccess: input.moduleAccess,
      },
      updatedAt: Timestamp.now(),
    });
  }

  async updateMemberAvatar(planId: string, input: UpdateMemberAvatarInput) {
    await updateDoc(getPlanDocumentRef(getFirebaseFirestore(), planId, 'members', input.memberId), {
      avatarUrl: input.avatarUrl,
      updatedAt: Timestamp.now(),
    });
  }

  async cascadeNicknameUpdate(userId: string, nickname: string) {
    const db = getFirebaseFirestore();
    const userPlansSnapshot = await getDocs(collection(db, 'userPlans', userId, 'plans'));
    const now = Timestamp.now();

    await Promise.all(
      userPlansSnapshot.docs.map(async (userPlanSnapshot) => {
        const { planId, memberId } = userPlanSnapshot.data() as { planId: string; memberId: string };
        const memberRef = getPlanDocumentRef(db, planId, 'members', memberId);
        const memberSnapshot = await getDoc(memberRef);

        if (!memberSnapshot.exists()) {
          return;
        }

        const member = memberSnapshot.data() as PlanMemberDocument;

        if (member.nicknameIsCustom) {
          return;
        }

        await updateDoc(memberRef, { nickname, updatedAt: now });
      }),
    );
  }

  async unlinkMemberAccount(planId: string, memberId: string) {
    const db = getFirebaseFirestore();
    const memberRef = getPlanDocumentRef(db, planId, 'members', memberId);

    await runTransaction(db, async (transaction) => {
      const memberSnapshot = await transaction.get(memberRef);

      if (!memberSnapshot.exists()) {
        return;
      }

      const member = memberSnapshot.data() as PlanMemberDocument;

      if (member.memberType !== 'registered' || !member.userId) {
        return;
      }

      transaction.update(memberRef, {
        userId: null,
        memberType: 'guest',
        email: null,
        updatedAt: Timestamp.now(),
      });

      transaction.delete(doc(db, 'userPlans', member.userId, 'plans', planId));
    });
  }

  async removeMember(planId: string, memberId: string) {
    const db = getFirebaseFirestore();
    const memberRef = getPlanDocumentRef(db, planId, 'members', memberId);
    const removedAt = await runTransaction(db, async (transaction) => {
      const memberSnapshot = await transaction.get(memberRef);

      if (!memberSnapshot.exists()) {
        return null;
      }

      const member = memberSnapshot.data() as PlanMemberDocument;

      if (member.status === 'removed') {
        return null;
      }

      const now = Timestamp.now();

      transaction.update(memberRef, {
        status: 'removed',
        removedAt: now,
        updatedAt: now,
      });

      return now;
    });

    if (removedAt !== null) {
      await syncPlanMemberCountAggregate(planId, removedAt);
    }
  }

  async reactivateMember(planId: string, memberId: string) {
    const db = getFirebaseFirestore();
    const memberRef = getPlanDocumentRef(db, planId, 'members', memberId);
    const reactivatedAt = await runTransaction(db, async (transaction) => {
      const memberSnapshot = await transaction.get(memberRef);

      if (!memberSnapshot.exists()) {
        return null;
      }

      const member = memberSnapshot.data() as PlanMemberDocument;

      if (member.status !== 'removed') {
        return null;
      }

      const now = Timestamp.now();

      transaction.update(memberRef, {
        status: 'active',
        removedAt: null,
        updatedAt: now,
      });

      return now;
    });

    if (reactivatedAt !== null) {
      await syncPlanMemberCountAggregate(planId, reactivatedAt);
    }
  }

  async deleteMember(planId: string, memberId: string) {
    const db = getFirebaseFirestore();
    const memberRef = getPlanDocumentRef(db, planId, 'members', memberId);
    const deletedAt = await runTransaction(db, async (transaction) => {
      const memberSnapshot = await transaction.get(memberRef);

      if (!memberSnapshot.exists()) {
        return null;
      }

      const member = memberSnapshot.data() as PlanMemberDocument;
      const now = Timestamp.now();

      transaction.delete(memberRef);

      if (member.memberType === 'registered' && member.userId) {
        transaction.delete(doc(db, 'userPlans', member.userId, 'plans', planId));
      }

      return member.status === 'active' ? now : null;
    });

    if (deletedAt !== null) {
      await syncPlanMemberCountAggregate(planId, deletedAt);
    }
  }
}
