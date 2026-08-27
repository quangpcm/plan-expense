'use client';

import {
  Timestamp,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  where,
  writeBatch,
} from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import type {
  CreateMilestonePersistenceInput,
  MilestoneRepository,
} from '@/modules/milestone/repositories/milestone.repository';
import type { MilestoneDocument, ReorderMilestoneInput, UpdateMilestoneInput } from '@/modules/milestone/types/milestone';
import { getPlanCollectionRef, getPlanDocumentRef, getPlanRootRef, queryByPlanCollection } from '@/modules/plan';
import type { TodoDocument } from '@/modules/todo/types/todo';
import { syncUserPlansAggregate } from '@/shared/lib/firestore/sync-user-plans';
import { logFirestorePermissionDebug } from '@/shared/utils/firestore-permission-debug';
import { mapFirebaseError } from '@/shared/utils/firebase-error';

export class FirestoreMilestoneRepository implements MilestoneRepository {
  async createMilestone(input: CreateMilestonePersistenceInput) {
    const db = getFirebaseFirestore();
    const milestoneRef = doc(getPlanCollectionRef(db, input.planId, 'milestones'));
    const planRef = getPlanRootRef(db, input.planId);
    const now = Timestamp.now();
    try {
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
          isSystemHidden: false,
          startDate: input.startDate ? Timestamp.fromDate(input.startDate) : null,
          endDate: input.endDate ? Timestamp.fromDate(input.endDate) : null,
          status: 'upcoming',
          orderIndex: nextOrderIndex,
          budgetAmount: input.budgetAmount,
          estimatedAmount: 0,
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
    } catch (error) {
      await logFirestorePermissionDebug({
        operation: 'createMilestone',
        db,
        planId: input.planId,
        userId: input.createdByUserId,
        error,
      });
      throw mapFirebaseError(error, 'Không thể tạo mốc lúc này.', 'MILESTONE_CREATE_FAILED');
    }

    await syncUserPlansAggregate(input.planId, {
      milestoneCount: increment(1),
      updatedAt: now,
    });

    return { milestoneId: milestoneRef.id };
  }

  async updateMilestone(planId: string, input: UpdateMilestoneInput) {
    const db = getFirebaseFirestore();
    const milestoneRef = getPlanDocumentRef(db, planId, 'milestones', input.milestoneId);
    const planRef = getPlanRootRef(db, planId);
    const now = Timestamp.now();

    const completedDelta = await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(milestoneRef);

      if (!snapshot.exists()) {
        throw new Error('Milestone not found.');
      }

      const previous = snapshot.data() as MilestoneDocument;

      if (previous.isSystemHidden) {
        throw new Error('System hidden milestone cannot be edited.');
      }

      const completedAt =
        input.status === 'completed'
          ? previous.completedAt ?? now
          : null;
      const cancelledAt =
        input.status === 'cancelled'
          ? previous.cancelledAt ?? now
          : null;
      const completedDelta =
        previous.status !== 'completed' && input.status === 'completed'
          ? 1
          : previous.status === 'completed' && input.status !== 'completed'
            ? -1
            : 0;

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
        completedMilestoneCount: increment(completedDelta),
        updatedAt: now,
      });

      return completedDelta;
    });

    if (completedDelta !== 0) {
      await syncUserPlansAggregate(planId, {
        completedMilestoneCount: increment(completedDelta),
        updatedAt: now,
      });
    }
  }

  async reorderMilestones(planId: string, input: ReorderMilestoneInput[]) {
    const db = getFirebaseFirestore();
    const milestoneSnapshots = await Promise.all(
      input.map((item) => getDoc(getPlanDocumentRef(db, planId, 'milestones', item.milestoneId))),
    );

    if (milestoneSnapshots.some((snapshot) => snapshot.exists() && (snapshot.data() as MilestoneDocument).isSystemHidden)) {
      throw new Error('System hidden milestone cannot be reordered.');
    }

    const batch = writeBatch(db);
    const now = Timestamp.now();

    input.forEach((item) => {
      batch.update(getPlanDocumentRef(db, planId, 'milestones', item.milestoneId), {
        orderIndex: item.orderIndex,
        updatedAt: now,
      });
    });

    batch.update(getPlanRootRef(db, planId), {
      updatedAt: now,
    });

    await batch.commit();
  }

  async deleteMilestone(planId: string, milestoneId: string) {
    const db = getFirebaseFirestore();
    const milestoneRef = getPlanDocumentRef(db, planId, 'milestones', milestoneId);
    const planRef = getPlanRootRef(db, planId);
    const now = Timestamp.now();

    const milestoneSnapshot = await getDoc(milestoneRef);

    if (!milestoneSnapshot.exists()) {
      throw new Error('Milestone not found.');
    }

    const milestone = milestoneSnapshot.data() as MilestoneDocument;

    if (milestone.isSystemHidden) {
      throw new Error('System hidden milestone cannot be deleted.');
    }

    const expensesSnapshot = await getDocs(
      queryByPlanCollection(db, planId, 'expenses', where('milestoneId', '==', milestoneId)),
    );

    if (!expensesSnapshot.empty) {
      throw new Error('Milestone này vẫn còn khoản chi. Vui lòng chuyển hoặc xoá khoản chi trước khi xoá mốc này.');
    }

    const todosSnapshot = await getDocs(
      queryByPlanCollection(db, planId, 'todos', where('milestoneId', '==', milestoneId)),
    );
    const todos = todosSnapshot.docs.map((snapshot) => snapshot.data() as TodoDocument);
    const orphanedAttachments = todos.flatMap((todo) => [
      ...(todo.attachments ?? []),
      ...(todo.vendors ?? []).flatMap((vendor) => vendor.attachments),
    ]);
    const completedTodoCount = todos.filter((todo) => todo.status === 'done').length;

    const refsToDelete = [milestoneRef, ...todosSnapshot.docs.map((snapshot) => snapshot.ref)];
    const CHUNK_SIZE = 450;

    for (let index = 0; index < refsToDelete.length; index += CHUNK_SIZE) {
      const batch = writeBatch(db);
      refsToDelete.slice(index, index + CHUNK_SIZE).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }

    const planUpdate = {
      milestoneCount: increment(-1),
      completedMilestoneCount: increment(milestone.status === 'completed' ? -1 : 0),
      todoCount: increment(-todos.length),
      completedTodoCount: increment(-completedTodoCount),
      estimatedAmount: increment(-(milestone.estimatedAmount ?? 0)),
      updatedAt: now,
    };

    const finalBatch = writeBatch(db);
    finalBatch.update(planRef, planUpdate);
    await finalBatch.commit();

    // Best-effort: the milestone and its todos are already durably deleted above (both batches
    // committed). This aggregate refresh into every member's `userPlans` dashboard mirror doc is a
    // secondary, derived-data sync — if it fails (e.g. one member's mirror doc predates a field the
    // "any active member" rule branch checks, rejecting the whole batch), that must not surface as
    // "failed to delete the milestone." Logged for diagnosability, same treatment as
    // deleteAttachmentsInBackground's fire-and-forget cleanup below.
    try {
      await syncUserPlansAggregate(planId, planUpdate);
    } catch (error) {
      console.error('Không thể đồng bộ userPlans sau khi xoá milestone:', error);
    }

    return { orphanedAttachments };
  }

  watchMilestones(
    planId: string,
    callback: (milestones: MilestoneDocument[]) => void,
    onError?: (error: Error) => void,
  ) {
    const milestonesQuery = query(
      getPlanCollectionRef(getFirebaseFirestore(), planId, 'milestones'),
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
      getPlanDocumentRef(getFirebaseFirestore(), planId, 'milestones', milestoneId),
      (snapshot) => {
        callback(snapshot.exists() ? (snapshot.data() as MilestoneDocument) : null);
      },
      (error) => {
        onError?.(mapFirebaseError(error, 'Unable to load this milestone.', 'MILESTONE_DETAIL_WATCH_FAILED'));
      },
    );
  }
}
