'use client';

import {
  Timestamp,
  collection,
  doc,
  increment,
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import type { AuthUser } from '@/modules/auth/types/auth';
import type {
  CreateIncomePersistenceInput,
  IncomeRepository,
} from '@/modules/income/repositories/income.repository';
import type { IncomeDocument, UpdateIncomeInput } from '@/modules/income/types/income';
import { mapFirebaseError } from '@/shared/utils/firebase-error';

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

  async updateIncome(planId: string, input: UpdateIncomeInput) {
    const db = getFirebaseFirestore();
    const incomeRef = doc(db, 'plans', planId, 'incomes', input.incomeId);
    const planRef = doc(db, 'plans', planId);
    const now = Timestamp.now();

    await runTransaction(db, async (transaction) => {
      const incomeSnapshot = await transaction.get(incomeRef);

      if (!incomeSnapshot.exists()) {
        return;
      }

      const previousIncome = incomeSnapshot.data() as IncomeDocument;
      const delta = input.amount - previousIncome.amount;

      transaction.update(incomeRef, {
        title: input.title,
        categoryId: input.categoryId || null,
        amount: input.amount,
        contributedByMemberId: input.contributedByMemberId,
        note: input.note || null,
        receivedAt: Timestamp.fromDate(input.receivedAt ? new Date(input.receivedAt) : new Date()),
        updatedAt: now,
        version: previousIncome.version + 1,
      });

      transaction.update(planRef, {
        totalIncome: increment(delta),
        updatedAt: now,
      });
    });
  }

  async softDeleteIncome(planId: string, incomeId: string, actor: AuthUser) {
    const db = getFirebaseFirestore();
    const incomeRef = doc(db, 'plans', planId, 'incomes', incomeId);
    const planRef = doc(db, 'plans', planId);
    const now = Timestamp.now();

    await runTransaction(db, async (transaction) => {
      const incomeSnapshot = await transaction.get(incomeRef);

      if (!incomeSnapshot.exists()) {
        return;
      }

      const income = incomeSnapshot.data() as IncomeDocument;

      if (income.status === 'deleted') {
        return;
      }

      transaction.update(incomeRef, {
        status: 'deleted',
        deletedAt: now,
        deletedByUserId: actor.uid,
        updatedAt: now,
        version: income.version + 1,
      });

      transaction.update(planRef, {
        incomeCount: increment(-1),
        totalIncome: increment(-income.amount),
        updatedAt: now,
      });
    });
  }

  watchIncomes(planId: string, callback: (incomes: IncomeDocument[]) => void, onError?: (error: Error) => void) {
    return onSnapshot(
      collection(getFirebaseFirestore(), 'plans', planId, 'incomes'),
      (snapshot) => {
        const incomes = snapshot.docs
          .map((item) => item.data() as IncomeDocument)
          .filter((income) => income.status === 'active')
          .sort((a, b) => b.receivedAt.toMillis() - a.receivedAt.toMillis());

        callback(incomes);
      },
      (error) => {
        onError?.(mapFirebaseError(error, 'Unable to load incomes for this plan.', 'INCOME_WATCH_FAILED'));
      },
    );
  }

  watchIncome(
    planId: string,
    incomeId: string,
    callback: (income: IncomeDocument | null) => void,
    onError?: (error: Error) => void,
  ) {
    return onSnapshot(
      doc(getFirebaseFirestore(), 'plans', planId, 'incomes', incomeId),
      (snapshot) => {
        callback(snapshot.exists() ? (snapshot.data() as IncomeDocument) : null);
      },
      (error) => {
        onError?.(mapFirebaseError(error, 'Unable to load this income.', 'INCOME_DETAIL_WATCH_FAILED'));
      },
    );
  }
}
