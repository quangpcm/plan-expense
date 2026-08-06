'use client';

import {
  Timestamp,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
} from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import type {
  CreatePlanPersistenceInput,
  PlanRepository,
  UpdatePlanPersistenceInput,
} from '@/modules/plan/repositories/plan.repository';
import type { PlanDocument, PlanSummary } from '@/modules/plan/types/plan';
import { AppError } from '@/shared/errors/app-error';
import { mapFirebaseError } from '@/shared/utils/firebase-error';

function mapPlanWriteError(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseCode = String(error.code);

    if (firebaseCode === 'permission-denied') {
      return new AppError(
        'Firestore rejected the write. Please check your Firestore rules or database mode.',
        'PLAN_CREATE_PERMISSION_DENIED',
        403,
      );
    }

    if (firebaseCode === 'unavailable') {
      return new AppError(
        'Firestore is temporarily unavailable. Please try again in a moment.',
        'PLAN_CREATE_UNAVAILABLE',
        503,
      );
    }

    if (firebaseCode === 'failed-precondition') {
      return new AppError(
        'Firestore is not ready for this operation yet. Please verify that the database is created and configured.',
        'PLAN_CREATE_FAILED_PRECONDITION',
        400,
      );
    }
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'PLAN_CREATE_UNKNOWN', 500);
  }

  return new AppError('Unable to create the plan right now.', 'PLAN_CREATE_UNKNOWN', 500);
}

export class FirestorePlanRepository implements PlanRepository {
  async createPlanGraph(input: CreatePlanPersistenceInput) {
    const db = getFirebaseFirestore();
    const batch = writeBatch(db);
    const now = Timestamp.now();

    const planRef = doc(collection(db, 'plans'));
    const ownerMemberRef = doc(collection(db, 'plans', planRef.id, 'members'));
    const userPlanRef = doc(db, 'userPlans', input.owner.uid, 'plans', planRef.id);

    batch.set(planRef, {
      id: planRef.id,
      name: input.name,
      description: input.description,
      planType: input.planType,
      ownerUserId: input.owner.uid,
      ownerMemberId: ownerMemberRef.id,
      currency: 'VND',
      timezone: input.timezone,
      coverImageUrl: null,
      coverImageStoragePath: null,
      startDate: input.startDate ? Timestamp.fromDate(input.startDate) : null,
      endDate: input.endDate ? Timestamp.fromDate(input.endDate) : null,
      status: 'active',
      memberCount: 1,
      expenseCount: 0,
      incomeCount: 0,
      settlementCount: 0,
      totalExpense: 0,
      totalIncome: 0,
      createdAt: now,
      updatedAt: now,
      closedAt: null,
      archivedAt: null,
    });

    batch.set(ownerMemberRef, {
      id: ownerMemberRef.id,
      planId: planRef.id,
      memberType: 'registered',
      userId: input.owner.uid,
      email: input.owner.email,
      nickname: input.owner.displayName?.trim() || input.owner.email?.split('@')[0] || 'Owner',
      avatarUrl: input.owner.photoURL,
      role: 'owner',
      permissions: {
        canEditAllExpenses: true,
      },
      status: 'active',
      invitedAt: null,
      joinedAt: now,
      removedAt: null,
      createdByUserId: input.owner.uid,
      createdAt: now,
      updatedAt: now,
    });

    batch.set(userPlanRef, {
      id: planRef.id,
      planId: planRef.id,
      userId: input.owner.uid,
      planName: input.name,
      planType: input.planType,
      role: 'owner',
      memberId: ownerMemberRef.id,
      memberStatus: 'active',
      planStatus: 'active',
      coverImageUrl: null,
      joinedAt: now,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });

    input.categoryPresets.forEach((category, index) => {
      const categoryRef = doc(collection(db, 'plans', planRef.id, 'categories'));

      batch.set(categoryRef, {
        id: categoryRef.id,
        planId: planRef.id,
        name: category.name,
        icon: category.icon,
        categoryType: category.categoryType,
        isDefault: true,
        isActive: true,
        sortOrder: index,
        createdByUserId: input.owner.uid,
        createdAt: now,
        updatedAt: now,
      });
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error('createPlanGraph failed', error);
      throw mapPlanWriteError(error);
    }

    return { planId: planRef.id };
  }

  async updatePlan(planId: string, input: UpdatePlanPersistenceInput) {
    const db = getFirebaseFirestore();
    const batch = writeBatch(db);
    const now = Timestamp.now();
    const planRef = doc(db, 'plans', planId);
    const membersSnapshot = await getDocs(collection(db, 'plans', planId, 'members'));

    batch.update(planRef, {
      name: input.name,
      startDate: input.startDate ? Timestamp.fromDate(input.startDate) : null,
      endDate: input.endDate ? Timestamp.fromDate(input.endDate) : null,
      updatedAt: now,
    });

    membersSnapshot.docs.forEach((memberSnapshot) => {
      const member = memberSnapshot.data() as { userId: string | null };

      if (!member.userId) {
        return;
      }

      batch.update(doc(db, 'userPlans', member.userId, 'plans', planId), {
        planName: input.name,
        updatedAt: now,
      });
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error('updatePlan failed', error);
      throw mapPlanWriteError(error);
    }
  }

  async closePlan(planId: string) {
    const db = getFirebaseFirestore();
    const batch = writeBatch(db);
    const now = Timestamp.now();
    const planRef = doc(db, 'plans', planId);
    const membersSnapshot = await getDocs(collection(db, 'plans', planId, 'members'));

    batch.update(planRef, {
      status: 'closed',
      closedAt: now,
      updatedAt: now,
    });

    membersSnapshot.docs.forEach((memberSnapshot) => {
      const member = memberSnapshot.data() as { userId: string | null };

      if (!member.userId) {
        return;
      }

      batch.update(doc(db, 'userPlans', member.userId, 'plans', planId), {
        planStatus: 'closed',
        updatedAt: now,
      });
    });

    await batch.commit();
  }

  watchUserPlans(userId: string, callback: (plans: PlanSummary[]) => void, onError?: (error: Error) => void) {
    const plansQuery = query(
      collection(getFirebaseFirestore(), 'userPlans', userId, 'plans'),
      orderBy('lastActivityAt', 'desc'),
    );

    return onSnapshot(
      plansQuery,
      (snapshot) => {
        const plans = snapshot.docs
          .map((item) => item.data() as PlanSummary)
          .filter((item) => item.memberStatus === 'active');

        callback(plans);
      },
      (error) => {
        onError?.(mapFirebaseError(error, 'Unable to load your plans.', 'USER_PLANS_WATCH_FAILED'));
      },
    );
  }

  watchPlan(planId: string, callback: (plan: PlanDocument | null) => void, onError?: (error: Error) => void) {
    return onSnapshot(
      doc(getFirebaseFirestore(), 'plans', planId),
      (snapshot) => {
        callback(snapshot.exists() ? (snapshot.data() as PlanDocument) : null);
      },
      (error) => {
        onError?.(mapFirebaseError(error, 'Unable to load this plan.', 'PLAN_WATCH_FAILED'));
      },
    );
  }
}
