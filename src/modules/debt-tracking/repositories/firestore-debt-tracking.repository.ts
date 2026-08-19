'use client';

import { Timestamp, doc, onSnapshot, orderBy, runTransaction } from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import { getPlanCollectionRef, getPlanDocumentRef, getPlanRootRef, queryByPlanCollection } from '@/modules/plan';
import type {
  CreateDebtPersistenceInput,
  DebtTrackingRepository,
  RecordRepaymentPersistenceInput,
} from '@/modules/debt-tracking/repositories/debt-tracking.repository';
import type { DebtDocument, RepaymentDocument } from '@/modules/debt-tracking/types/debt-tracking';
import { mapFirebaseError } from '@/shared/utils/firebase-error';

function toTimestamp(value: string) {
  return Timestamp.fromDate(new Date(value));
}

export class FirestoreDebtTrackingRepository implements DebtTrackingRepository {
  generateDebtId(planId: string): string {
    return doc(getPlanCollectionRef(getFirebaseFirestore(), planId, 'debts')).id;
  }

  generateRepaymentId(planId: string): string {
    return doc(getPlanCollectionRef(getFirebaseFirestore(), planId, 'repayments')).id;
  }

  async createDebt(input: CreateDebtPersistenceInput) {
    const db = getFirebaseFirestore();
    const debtRef = getPlanDocumentRef(db, input.planId, 'debts', input.debtId);
    const now = Timestamp.now();

    await runTransaction(db, async (transaction) => {
      transaction.set(debtRef, {
        id: debtRef.id,
        planId: input.planId,
        title: input.title.trim(),
        borrowerMemberId: input.borrowerMemberId?.trim() || null,
        lenderMemberId: input.lenderMemberId?.trim() || null,
        principalAmount: input.principalAmount,
        note: input.note?.trim() || null,
        dueDate: input.dueDate ? toTimestamp(input.dueDate) : null,
        status: 'active',
        createdByUserId: input.createdByUserId,
        createdByMemberId: input.createdByMemberId,
        createdAt: now,
        updatedAt: now,
        closedAt: null,
      } satisfies DebtDocument);

      transaction.update(getPlanRootRef(db, input.planId), {
        updatedAt: now,
      });
    });

    return { debtId: debtRef.id };
  }

  async recordRepayment(input: RecordRepaymentPersistenceInput) {
    const db = getFirebaseFirestore();
    const repaymentRef = getPlanDocumentRef(db, input.planId, 'repayments', input.repaymentId);
    const debtRef = getPlanDocumentRef(db, input.planId, 'debts', input.debtId);
    const now = Timestamp.now();

    await runTransaction(db, async (transaction) => {
      const debtSnapshot = await transaction.get(debtRef);

      if (!debtSnapshot.exists()) {
        throw new Error('Debt not found.');
      }

      const debt = debtSnapshot.data() as DebtDocument;
      const repaymentsSnapshot = await transaction.get(
        queryByPlanCollection(db, input.planId, 'repayments', orderBy('paidAt', 'desc')),
      );
      const paidAmountBefore = repaymentsSnapshot.docs
        .map((snapshot) => snapshot.data() as RepaymentDocument)
        .filter((repayment) => repayment.debtId === input.debtId)
        .reduce((total, repayment) => total + repayment.amount, 0);
      const paidAmountAfter = paidAmountBefore + input.amount;
      const isPaidOff = paidAmountAfter >= debt.principalAmount;

      transaction.set(repaymentRef, {
        id: repaymentRef.id,
        planId: input.planId,
        debtId: input.debtId,
        amount: input.amount,
        note: input.note?.trim() || null,
        paidAt: toTimestamp(input.paidAt),
        createdByUserId: input.createdByUserId,
        createdByMemberId: input.createdByMemberId,
        createdAt: now,
        updatedAt: now,
      } satisfies RepaymentDocument);

      transaction.update(debtRef, {
        status: isPaidOff ? 'paid' : 'active',
        updatedAt: now,
        closedAt: isPaidOff ? now : null,
      });

      transaction.update(getPlanRootRef(db, input.planId), {
        updatedAt: now,
      });
    });

    return { repaymentId: repaymentRef.id };
  }

  watchDebts(
    planId: string,
    callback: (debts: DebtDocument[]) => void,
    onError?: (error: Error) => void,
  ) {
    const debtsQuery = queryByPlanCollection(getFirebaseFirestore(), planId, 'debts', orderBy('createdAt', 'desc'));

    return onSnapshot(
      debtsQuery,
      (snapshot) => {
        callback(snapshot.docs.map((item) => item.data() as DebtDocument));
      },
      (error) => {
        onError?.(mapFirebaseError(error, 'Unable to load debts for this plan.', 'DEBT_WATCH_FAILED'));
      },
    );
  }

  watchRepayments(
    planId: string,
    callback: (repayments: RepaymentDocument[]) => void,
    onError?: (error: Error) => void,
  ) {
    const repaymentsQuery = queryByPlanCollection(
      getFirebaseFirestore(),
      planId,
      'repayments',
      orderBy('paidAt', 'desc'),
    );

    return onSnapshot(
      repaymentsQuery,
      (snapshot) => {
        callback(
          snapshot.docs
            .map((item) => item.data() as RepaymentDocument)
            .sort((left, right) => {
              const paidAtDiff =
                right.paidAt.toMillis() - left.paidAt.toMillis();

              if (paidAtDiff !== 0) {
                return paidAtDiff;
              }

              return right.createdAt.toMillis() - left.createdAt.toMillis();
            }),
        );
      },
      (error) => {
        onError?.(mapFirebaseError(error, 'Unable to load repayments for this plan.', 'REPAYMENT_WATCH_FAILED'));
      },
    );
  }
}
