'use client';

import { collection, doc, getDocs, updateDoc, writeBatch } from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';

export async function syncUserPlansAggregate(planId: string, fields: Record<string, unknown>) {
  const db = getFirebaseFirestore();
  const membersSnapshot = await getDocs(collection(db, 'plans', planId, 'members'));
  const batch = writeBatch(db);

  membersSnapshot.docs.forEach((memberSnapshot) => {
    const member = memberSnapshot.data() as { userId: string | null };

    if (!member.userId) {
      return;
    }

    batch.update(doc(db, 'userPlans', member.userId, 'plans', planId), fields);
  });

  await batch.commit();
}

export async function syncPlanMemberCountAggregate(planId: string, updatedAt: Timestamp) {
  const db = getFirebaseFirestore();
  const membersSnapshot = await getDocs(collection(db, 'plans', planId, 'members'));
  const activeMemberCount = membersSnapshot.docs.reduce((count, memberSnapshot) => {
    const member = memberSnapshot.data() as { status?: string; userId: string | null };
    return member.status === 'active' ? count + 1 : count;
  }, 0);

  await updateDoc(doc(db, 'plans', planId), {
    memberCount: activeMemberCount,
    updatedAt,
  });

  await syncUserPlansAggregate(planId, {
    memberCount: activeMemberCount,
    updatedAt,
  });
}
