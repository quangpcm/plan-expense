'use client';

import { getDocs, writeBatch } from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import { getPlanCollectionRef, getPlanDocumentRef, getPlanRootRef } from '@/modules/plan';
import type { TodoDocument } from '@/modules/todo/types/todo';
import { getTodoBudgetAmount } from '@/modules/todo/utils/todo-budget';
import { syncUserPlansAggregate } from '@/shared/lib/firestore/sync-user-plans';

export async function recalculateEstimatedAmounts(planId: string) {
  const db = getFirebaseFirestore();
  const [milestonesSnapshot, todosSnapshot] = await Promise.all([
    getDocs(getPlanCollectionRef(db, planId, 'milestones')),
    getDocs(getPlanCollectionRef(db, planId, 'todos')),
  ]);

  const milestones = milestonesSnapshot.docs.map((snapshot) => snapshot.data() as MilestoneDocument);
  const todos = todosSnapshot.docs.map((snapshot) => snapshot.data() as TodoDocument);
  const estimatedByMilestoneId = new Map<string, number>();

  todos.forEach((todo) => {
    const amount = getTodoBudgetAmount(todo) ?? 0;
    estimatedByMilestoneId.set(todo.milestoneId, (estimatedByMilestoneId.get(todo.milestoneId) ?? 0) + amount);
  });

  const batch = writeBatch(db);
  let planEstimatedAmount = 0;

  milestones.forEach((milestone) => {
    const estimatedAmount = Math.max(estimatedByMilestoneId.get(milestone.id) ?? 0, 0);
    planEstimatedAmount += estimatedAmount;

    if ((milestone.estimatedAmount ?? 0) !== estimatedAmount) {
      batch.update(getPlanDocumentRef(db, planId, 'milestones', milestone.id), {
        estimatedAmount,
      });
    }
  });

  batch.update(getPlanRootRef(db, planId), {
    estimatedAmount: Math.max(planEstimatedAmount, 0),
  });

  await batch.commit();
  await syncUserPlansAggregate(planId, {
    estimatedAmount: Math.max(planEstimatedAmount, 0),
  });
}
