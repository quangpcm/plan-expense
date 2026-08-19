'use client';

import {
  Timestamp,
  doc,
  increment,
  onSnapshot,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import type { AuthUser } from '@/modules/auth/types/auth';
import type {
  CreateExpensePersistenceInput,
  ExpenseRepository,
  UpdateExpensePersistenceInput,
} from '@/modules/expense/repositories/expense.repository';
import type { ExpenseDocument, ExpenseParticipant } from '@/modules/expense/types/expense';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import { getPlanCollectionRef, getPlanDocumentRef, getPlanRootRef } from '@/modules/plan';
import { diffRemovedAttachments } from '@/modules/storage/utils/diff-attachments';
import { syncUserPlansAggregate } from '@/shared/lib/firestore/sync-user-plans';
import { mapFirebaseError } from '@/shared/utils/firebase-error';

function isWritableMilestone(snapshot: { data(): unknown } | null) {
  const milestone = snapshot?.data() as Partial<MilestoneDocument> | undefined;
  return milestone?.isSystemHidden !== true;
}

function normalizeExpenseDocument(expense: ExpenseDocument): ExpenseDocument {
  return {
    ...expense,
    activityId: typeof expense.activityId === 'string' && expense.activityId.trim() ? expense.activityId : null,
  };
}

export class FirestoreExpenseRepository implements ExpenseRepository {
  generateExpenseId(planId: string): string {
    return doc(getPlanCollectionRef(getFirebaseFirestore(), planId, 'expenses')).id;
  }

  async createExpense(input: CreateExpensePersistenceInput) {
    const db = getFirebaseFirestore();
    const expenseRef = getPlanDocumentRef(db, input.planId, 'expenses', input.expenseId);
    const planRef = getPlanRootRef(db, input.planId);
    const milestoneRef = getPlanDocumentRef(db, input.planId, 'milestones', input.milestoneId);
    const now = Timestamp.now();

    const nextTotalExpense = await runTransaction(db, async (transaction) => {
      const planSnapshot = await transaction.get(planRef);
      const currentTotalExpense = (planSnapshot.data()?.totalExpense as number | undefined) ?? 0;
      const updatedTotalExpense = currentTotalExpense + input.amount;

      const milestoneSnapshot = await transaction.get(milestoneRef);

      if (!milestoneSnapshot.exists()) {
        throw new Error('Milestone not found.');
      }

      const currentMilestoneTotal = (milestoneSnapshot.data()?.totalExpense as number | undefined) ?? 0;

      transaction.set(expenseRef, {
        id: expenseRef.id,
        planId: input.planId,
        milestoneId: input.milestoneId,
        activityId: input.activityId,
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
        totalExpense: updatedTotalExpense,
        updatedAt: now,
      });

      if (isWritableMilestone(milestoneSnapshot)) {
        transaction.update(milestoneRef, {
          totalExpense: currentMilestoneTotal + input.amount,
          updatedAt: now,
        });
      }

      return updatedTotalExpense;
    });

    await syncUserPlansAggregate(input.planId, { totalExpense: nextTotalExpense, updatedAt: now });

    return { expenseId: expenseRef.id };
  }

  async updateExpense(planId: string, input: UpdateExpensePersistenceInput, participants: ExpenseParticipant[]) {
    const db = getFirebaseFirestore();
    const expenseRef = getPlanDocumentRef(db, planId, 'expenses', input.expenseId);
    const planRef = getPlanRootRef(db, planId);
    const now = Timestamp.now();

    const result = await runTransaction(db, async (transaction) => {
      const expenseSnapshot = await transaction.get(expenseRef);
      const planSnapshot = await transaction.get(planRef);

      if (!expenseSnapshot.exists()) {
        return null;
      }

      const previousExpense = expenseSnapshot.data() as ExpenseDocument;
      const orphanedAttachments = diffRemovedAttachments(previousExpense.attachments ?? [], input.attachments);
      const previousMilestoneId =
        typeof previousExpense.milestoneId === 'string' && previousExpense.milestoneId.trim()
          ? previousExpense.milestoneId
          : null;
      const previousMilestoneRef = previousMilestoneId
        ? getPlanDocumentRef(db, planId, 'milestones', previousMilestoneId)
        : null;
      const nextMilestoneRef = getPlanDocumentRef(db, planId, 'milestones', input.milestoneId);
      const previousMilestoneSnapshot = previousMilestoneRef ? await transaction.get(previousMilestoneRef) : null;
      const nextMilestoneSnapshot = await transaction.get(nextMilestoneRef);

      if (!nextMilestoneSnapshot.exists()) {
        throw new Error('Milestone not found.');
      }

      const delta = input.amount - previousExpense.amount;
      const currentTotalExpense = (planSnapshot.data()?.totalExpense as number | undefined) ?? 0;
      const updatedTotalExpense = currentTotalExpense + delta;
      const previousMilestoneTotal = (previousMilestoneSnapshot?.data()?.totalExpense as number | undefined) ?? 0;
      const nextMilestoneTotal = (nextMilestoneSnapshot.data()?.totalExpense as number | undefined) ?? 0;

      transaction.update(expenseRef, {
        title: input.title,
        milestoneId: input.milestoneId,
        activityId: input.activityId ?? null,
        categoryId: input.categoryId || null,
        amount: input.amount,
        paidByMemberId: input.paidByMemberId,
        participants,
        splitMethod: input.splitMethod,
        merchantName: input.merchantName || null,
        locationName: input.locationName || null,
        note: input.note || null,
        spentAt: Timestamp.fromDate(input.spentAt ? new Date(input.spentAt) : new Date()),
        attachments: input.attachments,
        updatedAt: now,
        version: previousExpense.version + 1,
      });

      transaction.update(planRef, {
        totalExpense: updatedTotalExpense,
        updatedAt: now,
      });

      if (previousMilestoneId === input.milestoneId) {
        if (isWritableMilestone(nextMilestoneSnapshot)) {
          transaction.update(nextMilestoneRef, {
            totalExpense: nextMilestoneTotal + delta,
            updatedAt: now,
          });
        }
      } else {
        if (
          previousMilestoneRef &&
          previousMilestoneSnapshot?.exists() &&
          isWritableMilestone(previousMilestoneSnapshot)
        ) {
          transaction.update(previousMilestoneRef, {
            totalExpense: previousMilestoneTotal - previousExpense.amount,
            updatedAt: now,
          });
        }
        if (isWritableMilestone(nextMilestoneSnapshot)) {
          transaction.update(nextMilestoneRef, {
            totalExpense: nextMilestoneTotal + input.amount,
            updatedAt: now,
          });
        }
      }

      return { updatedTotalExpense, orphanedAttachments };
    });

    if (result !== null) {
      await syncUserPlansAggregate(planId, { totalExpense: result.updatedTotalExpense, updatedAt: now });
    }

    return { orphanedAttachments: result?.orphanedAttachments ?? [] };
  }

  async deleteExpense(planId: string, expenseId: string, actor: AuthUser) {
    void actor;
    const db = getFirebaseFirestore();
    const expenseRef = getPlanDocumentRef(db, planId, 'expenses', expenseId);
    const planRef = getPlanRootRef(db, planId);
    const now = Timestamp.now();

    const result = await runTransaction(db, async (transaction) => {
      const expenseSnapshot = await transaction.get(expenseRef);
      const planSnapshot = await transaction.get(planRef);

      if (!expenseSnapshot.exists()) {
        return null;
      }

      const expense = expenseSnapshot.data() as ExpenseDocument;
      const milestoneRef = getPlanDocumentRef(db, planId, 'milestones', expense.milestoneId);
      const milestoneSnapshot = await transaction.get(milestoneRef);

      if (!milestoneSnapshot.exists()) {
        throw new Error('Milestone not found.');
      }

      const currentTotalExpense = (planSnapshot.data()?.totalExpense as number | undefined) ?? 0;
      const updatedTotalExpense = currentTotalExpense - expense.amount;
      const currentMilestoneTotal = (milestoneSnapshot.data()?.totalExpense as number | undefined) ?? 0;

      transaction.delete(expenseRef);

      transaction.update(planRef, {
        expenseCount: increment(-1),
        totalExpense: updatedTotalExpense,
        updatedAt: now,
      });

      if (isWritableMilestone(milestoneSnapshot)) {
        transaction.update(milestoneRef, {
          totalExpense: currentMilestoneTotal - expense.amount,
          updatedAt: now,
        });
      }

      return { updatedTotalExpense, orphanedAttachments: expense.attachments ?? [] };
    });

    if (result !== null) {
      await syncUserPlansAggregate(planId, { totalExpense: result.updatedTotalExpense, updatedAt: now });
    }

    return { orphanedAttachments: result?.orphanedAttachments ?? [] };
  }

  watchExpenses(planId: string, callback: (expenses: ExpenseDocument[]) => void, onError?: (error: Error) => void) {
    return onSnapshot(
      getPlanCollectionRef(getFirebaseFirestore(), planId, 'expenses'),
      (snapshot) => {
        const expenses = snapshot.docs
          .map((item) => normalizeExpenseDocument(item.data() as ExpenseDocument))
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
      getPlanDocumentRef(getFirebaseFirestore(), planId, 'expenses', expenseId),
      (snapshot) => {
        callback(snapshot.exists() ? normalizeExpenseDocument(snapshot.data() as ExpenseDocument) : null);
      },
      (error) => {
        onError?.(mapFirebaseError(error, 'Unable to load this expense.', 'EXPENSE_DETAIL_WATCH_FAILED'));
      },
    );
  }
}
