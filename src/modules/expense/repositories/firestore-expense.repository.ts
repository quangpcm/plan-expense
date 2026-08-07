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
  CreateExpensePersistenceInput,
  ExpenseRepository,
} from '@/modules/expense/repositories/expense.repository';
import type { ExpenseDocument, ExpenseParticipant, UpdateExpenseInput } from '@/modules/expense/types/expense';
import { syncUserPlansAggregate } from '@/shared/lib/firestore/sync-user-plans';
import { mapFirebaseError } from '@/shared/utils/firebase-error';

export class FirestoreExpenseRepository implements ExpenseRepository {
  async createExpense(input: CreateExpensePersistenceInput) {
    const db = getFirebaseFirestore();
    const expenseRef = doc(collection(db, 'plans', input.planId, 'expenses'));
    const planRef = doc(db, 'plans', input.planId);
    const now = Timestamp.now();

    await runTransaction(db, async (transaction) => {
      transaction.set(expenseRef, {
        id: expenseRef.id,
        planId: input.planId,
        title: input.title,
        categoryId: input.categoryId,
        amount: input.amount,
        currency: 'VND',
        paidByMemberId: input.paidByMemberId,
        participants: input.participants,
        splitMethod: input.splitMethod,
        merchantName: input.merchantName,
        locationName: input.locationName,
        note: input.note,
        attachments: input.attachments,
        spentAt: Timestamp.fromDate(input.spentAt),
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
        expenseCount: increment(1),
        totalExpense: increment(input.amount),
        updatedAt: now,
      });
    });

    await syncUserPlansAggregate(input.planId, { totalExpense: increment(input.amount) });

    return { expenseId: expenseRef.id };
  }

  async updateExpense(planId: string, input: UpdateExpenseInput, participants: ExpenseParticipant[]) {
    const db = getFirebaseFirestore();
    const expenseRef = doc(db, 'plans', planId, 'expenses', input.expenseId);
    const planRef = doc(db, 'plans', planId);
    const now = Timestamp.now();

    const amountDelta = await runTransaction(db, async (transaction) => {
      const expenseSnapshot = await transaction.get(expenseRef);

      if (!expenseSnapshot.exists()) {
        return 0;
      }

      const previousExpense = expenseSnapshot.data() as ExpenseDocument;
      const delta = input.amount - previousExpense.amount;

      transaction.update(expenseRef, {
        title: input.title,
        categoryId: input.categoryId || null,
        amount: input.amount,
        paidByMemberId: input.paidByMemberId,
        participants,
        splitMethod: input.splitMethod,
        merchantName: input.merchantName || null,
        locationName: input.locationName || null,
        note: input.note || null,
        spentAt: Timestamp.fromDate(input.spentAt ? new Date(input.spentAt) : new Date()),
        updatedAt: now,
        version: previousExpense.version + 1,
      });

      transaction.update(planRef, {
        totalExpense: increment(delta),
        updatedAt: now,
      });

      return delta;
    });

    if (amountDelta !== 0) {
      await syncUserPlansAggregate(planId, { totalExpense: increment(amountDelta) });
    }
  }

  async softDeleteExpense(planId: string, expenseId: string, actor: AuthUser) {
    const db = getFirebaseFirestore();
    const expenseRef = doc(db, 'plans', planId, 'expenses', expenseId);
    const planRef = doc(db, 'plans', planId);
    const now = Timestamp.now();

    const deletedAmount = await runTransaction(db, async (transaction) => {
      const expenseSnapshot = await transaction.get(expenseRef);

      if (!expenseSnapshot.exists()) {
        return 0;
      }

      const expense = expenseSnapshot.data() as ExpenseDocument;

      if (expense.status === 'deleted') {
        return 0;
      }

      transaction.update(expenseRef, {
        status: 'deleted',
        deletedAt: now,
        deletedByUserId: actor.uid,
        updatedAt: now,
        version: expense.version + 1,
      });

      transaction.update(planRef, {
        expenseCount: increment(-1),
        totalExpense: increment(-expense.amount),
        updatedAt: now,
      });

      return expense.amount;
    });

    if (deletedAmount !== 0) {
      await syncUserPlansAggregate(planId, { totalExpense: increment(-deletedAmount) });
    }
  }

  watchExpenses(planId: string, callback: (expenses: ExpenseDocument[]) => void, onError?: (error: Error) => void) {
    return onSnapshot(
      collection(getFirebaseFirestore(), 'plans', planId, 'expenses'),
      (snapshot) => {
        const expenses = snapshot.docs
          .map((item) => item.data() as ExpenseDocument)
          .filter((expense) => expense.status === 'active')
          .sort((a, b) => b.spentAt.toMillis() - a.spentAt.toMillis());

        callback(expenses);
      },
      (error) => {
        onError?.(mapFirebaseError(error, 'Unable to load expenses for this plan.', 'EXPENSE_WATCH_FAILED'));
      },
    );
  }

  watchExpense(
    planId: string,
    expenseId: string,
    callback: (expense: ExpenseDocument | null) => void,
    onError?: (error: Error) => void,
  ) {
    return onSnapshot(
      doc(getFirebaseFirestore(), 'plans', planId, 'expenses', expenseId),
      (snapshot) => {
        callback(snapshot.exists() ? (snapshot.data() as ExpenseDocument) : null);
      },
      (error) => {
        onError?.(mapFirebaseError(error, 'Unable to load this expense.', 'EXPENSE_DETAIL_WATCH_FAILED'));
      },
    );
  }
}
