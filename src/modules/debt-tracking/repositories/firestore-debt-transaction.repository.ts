'use client';

import { Timestamp, doc, onSnapshot, runTransaction } from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import { getPlanCollectionRef, getPlanDocumentRef, getPlanRootRef } from '@/modules/plan';
import type {
  CreateDebtTransactionPersistenceInput,
  DebtTransactionRepository,
  UpdateDebtTransactionPersistenceInput,
} from '@/modules/debt-tracking/repositories/debt-transaction.repository';
import type { DebtDirection, DebtTransaction, DebtTransactionType } from '@/modules/debt-tracking/types/debt-transaction';
import { diffRemovedAttachments } from '@/modules/storage/utils/diff-attachments';
import { syncUserPlansAggregate } from '@/shared/lib/firestore/sync-user-plans';
import { mapFirebaseError } from '@/shared/utils/firebase-error';

type OutstandingField = 'debtReceivableOutstanding' | 'debtPayableOutstanding';

function outstandingFieldFor(direction: DebtDirection): OutstandingField {
  return direction === 'receivable' ? 'debtReceivableOutstanding' : 'debtPayableOutstanding';
}

// loan tăng outstanding của direction đó, repayment giảm (docs/debt-plan-specs.md #7/#15).
function signedAmountFor(type: DebtTransactionType, amount: number): number {
  return type === 'loan' ? amount : -amount;
}

export class FirestoreDebtTransactionRepository implements DebtTransactionRepository {
  generateDebtTransactionId(planId: string): string {
    return doc(getPlanCollectionRef(getFirebaseFirestore(), planId, 'debtTransactions')).id;
  }

  async createDebtTransaction(input: CreateDebtTransactionPersistenceInput) {
    const db = getFirebaseFirestore();
    const transactionRef = getPlanDocumentRef(db, input.planId, 'debtTransactions', input.transactionId);
    const planRef = getPlanRootRef(db, input.planId);
    const now = Timestamp.now();
    const field = outstandingFieldFor(input.direction);
    const delta = signedAmountFor(input.type, input.amount);

    const nextOutstanding = await runTransaction(db, async (transaction) => {
      const planSnapshot = await transaction.get(planRef);
      const currentOutstanding = (planSnapshot.data()?.[field] as number | undefined) ?? 0;
      const updatedOutstanding = currentOutstanding + delta;

      transaction.set(transactionRef, {
        id: transactionRef.id,
        planId: input.planId,
        counterpartyMemberId: input.counterpartyMemberId,
        direction: input.direction,
        type: input.type,
        amount: input.amount,
        occurredAt: Timestamp.fromDate(input.occurredAt),
        dueDate: input.dueDate ? Timestamp.fromDate(input.dueDate) : null,
        note: input.note,
        attachments: input.attachments,
        createdByUserId: input.createdByUser.uid,
        createdByMemberId: input.createdByMember.id,
        createdAt: now,
        updatedAt: now,
      } satisfies DebtTransaction);

      transaction.update(planRef, {
        [field]: updatedOutstanding,
        updatedAt: now,
      });

      return updatedOutstanding;
    });

    await syncUserPlansAggregate(input.planId, { [field]: nextOutstanding, updatedAt: now });

    return { transactionId: transactionRef.id };
  }

  async updateDebtTransaction(planId: string, input: UpdateDebtTransactionPersistenceInput) {
    const db = getFirebaseFirestore();
    const transactionRef = getPlanDocumentRef(db, planId, 'debtTransactions', input.transactionId);
    const planRef = getPlanRootRef(db, planId);
    const now = Timestamp.now();

    const result = await runTransaction(db, async (transaction) => {
      const transactionSnapshot = await transaction.get(transactionRef);
      const planSnapshot = await transaction.get(planRef);

      if (!transactionSnapshot.exists()) {
        return null;
      }

      const previous = transactionSnapshot.data() as DebtTransaction;
      const orphanedAttachments = diffRemovedAttachments(previous.attachments ?? [], input.attachments);
      const field = outstandingFieldFor(previous.direction);
      const delta = signedAmountFor(previous.type, input.amount - previous.amount);
      const currentOutstanding = (planSnapshot.data()?.[field] as number | undefined) ?? 0;
      const updatedOutstanding = currentOutstanding + delta;

      transaction.update(transactionRef, {
        amount: input.amount,
        occurredAt: Timestamp.fromDate(input.occurredAt),
        dueDate: input.dueDate ? Timestamp.fromDate(input.dueDate) : null,
        note: input.note,
        attachments: input.attachments,
        updatedAt: now,
      });

      transaction.update(planRef, {
        [field]: updatedOutstanding,
        updatedAt: now,
      });

      return { field, updatedOutstanding, orphanedAttachments };
    });

    if (result !== null) {
      await syncUserPlansAggregate(planId, { [result.field]: result.updatedOutstanding, updatedAt: now });
    }

    return { orphanedAttachments: result?.orphanedAttachments ?? [] };
  }

  async deleteDebtTransaction(planId: string, transactionId: string) {
    const db = getFirebaseFirestore();
    const transactionRef = getPlanDocumentRef(db, planId, 'debtTransactions', transactionId);
    const planRef = getPlanRootRef(db, planId);
    const now = Timestamp.now();

    const result = await runTransaction(db, async (transaction) => {
      const transactionSnapshot = await transaction.get(transactionRef);
      const planSnapshot = await transaction.get(planRef);

      if (!transactionSnapshot.exists()) {
        return null;
      }

      const existing = transactionSnapshot.data() as DebtTransaction;
      const field = outstandingFieldFor(existing.direction);
      const delta = -signedAmountFor(existing.type, existing.amount);
      const currentOutstanding = (planSnapshot.data()?.[field] as number | undefined) ?? 0;
      const updatedOutstanding = currentOutstanding + delta;

      transaction.delete(transactionRef);

      transaction.update(planRef, {
        [field]: updatedOutstanding,
        updatedAt: now,
      });

      return { field, updatedOutstanding, orphanedAttachments: existing.attachments ?? [] };
    });

    if (result !== null) {
      await syncUserPlansAggregate(planId, { [result.field]: result.updatedOutstanding, updatedAt: now });
    }

    return { orphanedAttachments: result?.orphanedAttachments ?? [] };
  }

  watchDebtTransactions(
    planId: string,
    callback: (transactions: DebtTransaction[]) => void,
    onError?: (error: Error) => void,
  ) {
    return onSnapshot(
      getPlanCollectionRef(getFirebaseFirestore(), planId, 'debtTransactions'),
      (snapshot) => {
        const transactions = snapshot.docs
          .map((item) => item.data() as DebtTransaction)
          .sort((a, b) => b.occurredAt.toMillis() - a.occurredAt.toMillis());

        callback(transactions);
      },
      (error) => {
        onError?.(mapFirebaseError(error, 'Unable to load debt transactions for this plan.', 'DEBT_TRANSACTION_WATCH_FAILED'));
      },
    );
  }
}

