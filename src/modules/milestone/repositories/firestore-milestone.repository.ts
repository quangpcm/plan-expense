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
  writeBatch,
} from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import type {
  CreateMilestonePersistenceInput,
  MilestoneRepository,
} from '@/modules/milestone/repositories/milestone.repository';
import type { MilestoneDocument, ReorderMilestoneInput, UpdateMilestoneInput } from '@/modules/milestone/types/milestone';
import { mapFirebaseError } from '@/shared/utils/firebase-error';

export class FirestoreMilestoneRepository implements MilestoneRepository {
  async createMilestone(input: CreateMilestonePersistenceInput) {
    const db = getFirebaseFirestore();
    const milestoneRef = doc(collection(db, 'plans', input.planId, 'milestones'));
    const planRef = doc(db, 'plans', input.planId);
    const now = Timestamp.now();

    await runTransaction(db, async (transaction) => {
      const planSnapshot = await transaction.get(planRef);
      const storedMilestoneCount = planSnapshot.data()?.milestoneCount;
      const nextOrderIndex =
        typeof storedMilestoneCount === 'number'
          ? storedMilestoneCount
          : Number.isFinite(input.orderIndex)
            ? input.orderIndex
            : 0;

      transaction.set(milestoneRef, {
        id: milestoneRef.id,
        planId: input.planId,
        title: input.title,
        description: input.description,
        iconId: input.iconId,
        startDate: input.startDate ? Timestamp.fromDate(input.startDate) : null,
        endDate: input.endDate ? Timestamp.fromDate(input.endDate) : null,
        status: 'upcoming',
        orderIndex: nextOrderIndex,
        budgetAmount: input.budgetAmount,
        totalExpense: 0,
        todoCount: 0,
        completedTodoCount: 0,
        createdByUserId: input.createdByUserId,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        cancelledAt: null,
      } satisfies MilestoneDocument);

      transaction.update(planRef, {
        milestoneCount: increment(1),
        updatedAt: now,
      });
    });

    return { milestoneId: milestoneRef.id };
  }

  async updateMilestone(planId: string, input: UpdateMilestoneInput) {
    const db = getFirebaseFirestore();
    const milestoneRef = doc(db, 'plans', planId, 'milestones', input.milestoneId);
    const planRef = doc(db, 'plans', planId);
    const now = Timestamp.now();

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(milestoneRef);

      if (!snapshot.exists()) {
        throw new Error('Milestone not found.');
      }

      const previous = snapshot.data() as MilestoneDocument;
      const completedAt =
        input.status === 'completed'
          ? previous.completedAt ?? now
          : null;
      const cancelledAt =
        input.status === 'cancelled'
          ? previous.cancelledAt ?? now
          : null;

      transaction.update(milestoneRef, {
        title: input.title,
        description: input.description?.trim() || null,
        iconId: input.iconId?.trim() || null,
        startDate: input.startDate ? Timestamp.fromDate(new Date(input.startDate)) : null,
        endDate: input.endDate ? Timestamp.fromDate(new Date(input.endDate)) : null,
        status: input.status,
        budgetAmount: input.budgetAmount ?? null,
        updatedAt: now,
        completedAt,
        cancelledAt,
      });

      transaction.update(planRef, {
        updatedAt: now,
      });
    });
  }

  async reorderMilestones(planId: string, input: ReorderMilestoneInput[]) {
    const db = getFirebaseFirestore();
    const batch = writeBatch(db);
    const now = Timestamp.now();

    input.forEach((item) => {
      batch.update(doc(db, 'plans', planId, 'milestones', item.milestoneId), {
        orderIndex: item.orderIndex,
        updatedAt: now,
      });
    });

    batch.update(doc(db, 'plans', planId), {
      updatedAt: now,
    });

    await batch.commit();
  }

  watchMilestones(
    planId: string,
    callback: (milestones: MilestoneDocument[]) => void,
    onError?: (error: Error) => void,
  ) {
    const milestonesQuery = query(
      collection(getFirebaseFirestore(), 'plans', planId, 'milestones'),
      orderBy('orderIndex', 'asc'),
    );

    return onSnapshot(
      milestonesQuery,
      (snapshot) => {
        callback(snapshot.docs.map((item) => item.data() as MilestoneDocument));
      },
      (error) => {
        onError?.(mapFirebaseError(error, 'Unable to load milestones for this plan.', 'MILESTONE_WATCH_FAILED'));
      },
    );
  }

  watchMilestone(
    planId: string,
    milestoneId: string,
    callback: (milestone: MilestoneDocument | null) => void,
    onError?: (error: Error) => void,
  ) {
    return onSnapshot(
      doc(getFirebaseFirestore(), 'plans', planId, 'milestones', milestoneId),
      (snapshot) => {
        callback(snapshot.exists() ? (snapshot.data() as MilestoneDocument) : null);
      },
      (error) => {
        onError?.(mapFirebaseError(error, 'Unable to load this milestone.', 'MILESTONE_DETAIL_WATCH_FAILED'));
      },
    );
  }
}
