'use client';

import {
  Timestamp,
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
import { getPlanCollectionRef, getPlanDocumentRef, getPlanRootRef } from '@/modules/plan';
import { syncUserPlansAggregate } from '@/shared/lib/firestore/sync-user-plans';
import { mapFirebaseError } from '@/shared/utils/firebase-error';

export class FirestoreIncomeRepository implements IncomeRepository {
  async createIncome(input: CreateIncomePersistenceInput) {
    const db = getFirebaseFirestore();
    const incomeRef = doc(getPlanCollectionRef(db, input.planId, 'incomes'));
    const planRef = getPlanRootRef(db, input.planId);
    const now = Timestamp.now();

    await runTransaction(db, async (transaction) => {
      transaction.set(incomeRef, {
        id: incomeRef.id,
        planId: input.planId,
        milestoneId: input.milestoneId,
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

    await syncUserPlansAggregate(input.planId, { totalIncome: increment(input.amount), updatedAt: now });

    return { incomeId: incomeRef.id };
  }

  async updateIncome(planId: string, input: UpdateIncomeInput) {
    const db = getFirebaseFirestore();
    const incomeRef = getPlanDocumentRef(db, planId, 'incomes', input.incomeId);
    const planRef = getPlanRootRef(db, planId);
    const now = Timestamp.now();

    const delta = await runTransaction(db, async (transaction) => {
      const incomeSnapshot = await transaction.get(incomeRef);

      if (!incomeSnapshot.exists()) {
        return null;
      }

      const previousIncome = incomeSnapshot.data() as IncomeDocument;
      const amountDelta = input.amount - previousIncome.amount;

      transaction.update(incomeRef, {
        title: input.title,
        milestoneId: input.milestoneId,
        categoryId: input.categoryId || null,
        amount: input.amount,
        contributedByMemberId: input.contributedByMemberId,
        note: input.note || null,
        receivedAt: Timestamp.fromDate(input.receivedAt ? new Date(input.receivedAt) : new Date()),
        updatedAt: now,
        version: previousIncome.version + 1,
      });

      transaction.update(planRef, {
        totalIncome: increment(amountDelta),
        updatedAt: now,
      });

      return amountDelta;
    });

    if (delta !== null) {
      await syncUserPlansAggregate(planId, { totalIncome: increment(delta), updatedAt: now });
    }
  }

  async softDeleteIncome(planId: string, incomeId: string, actor: AuthUser) {
    const db = getFirebaseFirestore();
    const incomeRef = getPlanDocumentRef(db, planId, 'incomes', incomeId);
    const planRef = getPlanRootRef(db, planId);
    const now = Timestamp.now();

    const deletedAmount = await runTransaction(db, async (transaction) => {
      const incomeSnapshot = await transaction.get(incomeRef);

      if (!incomeSnapshot.exists()) {
        return null;
      }

      const income = incomeSnapshot.data() as IncomeDocument;

      if (income.status === 'deleted') {
        return null;
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

      return income.amount;
    });

    if (deletedAmount !== null) {
      await syncUserPlansAggregate(planId, { totalIncome: increment(-deletedAmount), updatedAt: now });
    }
  }

  watchIncomes(planId: string, callback: (incomes: IncomeDocument[]) => void, onError?: (error: Error) => void) {
    return onSnapshot(
      getPlanCollectionRef(getFirebaseFirestore(), planId, 'incomes'),
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
      getPlanDocumentRef(getFirebaseFirestore(), planId, 'incomes', incomeId),
      (snapshot) => {
        callback(snapshot.exists() ? (snapshot.data() as IncomeDocument) : null);
      },
      (error) => {
        onError?.(mapFirebaseError(error, 'Unable to load this income.', 'INCOME_DETAIL_WATCH_FAILED'));
      },
    );
  }
}
