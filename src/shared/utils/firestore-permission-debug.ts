'use client';

import { doc, getDoc, type Firestore } from 'firebase/firestore';

import { getPlanDocumentRef, getPlanRootRef } from '@/modules/plan';

type PermissionDebugContext = {
  operation: string;
  db: Firestore;
  planId: string;
  milestoneId?: string | null;
  userId?: string | null;
  error: unknown;
};

function summarizeDoc(data: Record<string, unknown> | undefined) {
  if (!data) {
    return { exists: false };
  }

  return {
    exists: true,
    keys: Object.keys(data).sort(),
    counters: {
      memberCount: data.memberCount ?? '(missing)',
      milestoneCount: data.milestoneCount ?? '(missing)',
      completedMilestoneCount: data.completedMilestoneCount ?? '(missing)',
      todoCount: data.todoCount ?? '(missing)',
      completedTodoCount: data.completedTodoCount ?? '(missing)',
      expenseCount: data.expenseCount ?? '(missing)',
      incomeCount: data.incomeCount ?? '(missing)',
      settlementCount: data.settlementCount ?? '(missing)',
      estimatedAmount: data.estimatedAmount ?? '(missing)',
      totalExpense: data.totalExpense ?? '(missing)',
      totalIncome: data.totalIncome ?? '(missing)',
    },
    identity: {
      id: data.id ?? '(missing)',
      ownerUserId: data.ownerUserId ?? '(missing)',
      ownerMemberId: data.ownerMemberId ?? '(missing)',
      createdByUserId: data.createdByUserId ?? '(missing)',
      createdAt: data.createdAt ?? '(missing)',
      updatedAt: data.updatedAt ?? '(missing)',
    },
    planning: {
      isSystemHidden: data.isSystemHidden ?? '(missing)',
      status: data.status ?? '(missing)',
      orderIndex: data.orderIndex ?? '(missing)',
    },
    permissions: data.permissions ?? '(missing)',
  };
}

function isPermissionDenied(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'code' in error && String(error.code) === 'permission-denied');
}

export async function logFirestorePermissionDebug(context: PermissionDebugContext) {
  if (!isPermissionDenied(context.error)) {
    return;
  }

  try {
    const planSnapshotPromise = getDoc(getPlanRootRef(context.db, context.planId));
    const milestoneSnapshotPromise = context.milestoneId
      ? getDoc(getPlanDocumentRef(context.db, context.planId, 'milestones', context.milestoneId))
      : Promise.resolve(null);
    const userPlanSnapshotPromise = context.userId
      ? getDoc(doc(context.db, 'userPlans', context.userId, 'plans', context.planId))
      : Promise.resolve(null);

    const [planSnapshot, milestoneSnapshot, userPlanSnapshot] = await Promise.all([
      planSnapshotPromise,
      milestoneSnapshotPromise,
      userPlanSnapshotPromise,
    ]);

    const userPlanData = userPlanSnapshot?.exists() ? (userPlanSnapshot.data() as Record<string, unknown>) : undefined;
    const memberId =
      userPlanData && typeof userPlanData.memberId === 'string' && userPlanData.memberId.trim() ? userPlanData.memberId : null;
    const memberSnapshot = memberId
      ? await getDoc(getPlanDocumentRef(context.db, context.planId, 'members', memberId))
      : null;

    console.error(`[FirestoreDebug] ${context.operation} permission denied`, {
      planId: context.planId,
      milestoneId: context.milestoneId ?? null,
      userId: context.userId ?? null,
      plan: summarizeDoc(planSnapshot.exists() ? (planSnapshot.data() as Record<string, unknown>) : undefined),
      milestone: summarizeDoc(milestoneSnapshot?.exists() ? (milestoneSnapshot.data() as Record<string, unknown>) : undefined),
      userPlan: summarizeDoc(userPlanData),
      member: summarizeDoc(memberSnapshot?.exists() ? (memberSnapshot.data() as Record<string, unknown>) : undefined),
      originalError: context.error,
    });
  } catch (debugError) {
    console.error(`[FirestoreDebug] ${context.operation} failed to collect permission context`, {
      planId: context.planId,
      milestoneId: context.milestoneId ?? null,
      userId: context.userId ?? null,
      originalError: context.error,
      debugError,
    });
  }
}
