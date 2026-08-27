'use client';

import { doc, getDoc, setDoc } from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import type { TodaySummaryRepository } from '@/modules/today/repositories/today-summary.repository';
import type { TodaySummaryDocument } from '@/modules/today/types/today-summary';

function getTodaySummaryDocRef(userId: string) {
  return doc(getFirebaseFirestore(), 'users', userId, 'todaySummary', 'current');
}

export class FirestoreTodaySummaryRepository implements TodaySummaryRepository {
  async getSummary(userId: string) {
    const snapshot = await getDoc(getTodaySummaryDocRef(userId));

    return snapshot.exists() ? (snapshot.data() as TodaySummaryDocument) : null;
  }

  async writeSummary(userId: string, summary: TodaySummaryDocument) {
    await setDoc(getTodaySummaryDocRef(userId), summary);
  }
}
