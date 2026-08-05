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
  where,
} from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import type {
  CreateIncomePersistenceInput,
  IncomeRepository,
} from '@/modules/income/repositories/income.repository';
import type { IncomeDocument } from '@/modules/income/types/income';

export class FirestoreIncomeRepository implements IncomeRepository {
  async createIncome(input: CreateIncomePersistenceInput) {
    const db = getFirebaseFirestore();
    const incomeRef = doc(collection(db, 'plans', input.planId, 'incomes'));
    const planRef = doc(db, 'plans', input.planId);
    const now = Timestamp.now();

    await runTransaction(db, async (transaction) => {
      transaction.set(incomeRef, {
        id: incomeRef.id,
        planId: input.planId,
        title: input.title,
        categoryId: input.categoryId,
        amount: input.amount,
        currency: 'VND',
        contributedByMemberId: input.contributedByMemberId,
        note: input.note,
        attachments: [],
        receivedAt: Timestamp.fromDate(input.receivedAt),
        createdByUserId: input.createdByUser.uid,
        createdByMemberId: input.createdByMember.id,
        createdAt: now,
        updatedAt: now,
        status: 'active',
        deletedAt: null,
        deletedByUserId: null,
        version: 1,
      });

      transaction.update(planRef, {
        incomeCount: increment(1),
        totalIncome: increment(input.amount),
        updatedAt: now,
      });
    });

    return { incomeId: incomeRef.id };
  }

  watchIncomes(planId: string, callback: (incomes: IncomeDocument[]) => void) {
    const incomesQuery = query(
      collection(getFirebaseFirestore(), 'plans', planId, 'incomes'),
      where('status', '==', 'active'),
      orderBy('receivedAt', 'desc'),
    );

    return onSnapshot(incomesQuery, (snapshot) => {
      callback(snapshot.docs.map((item) => item.data() as IncomeDocument));
    });
  }
}

