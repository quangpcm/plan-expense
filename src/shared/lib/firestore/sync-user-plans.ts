'use client';

import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';

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
