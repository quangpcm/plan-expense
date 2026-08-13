'use client';

import {
  Timestamp,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { DocumentReference } from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import { milestoneTemplatesByPlanType } from '@/modules/plan/constants/milestone-templates';
import type {
  CreatePlanPersistenceInput,
  PlanRepository,
  UpdatePlanPersistenceInput,
} from '@/modules/plan/repositories/plan.repository';
import type { PlanDocument, PlanSummary } from '@/modules/plan/types/plan';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import { AppError } from '@/shared/errors/app-error';
import { syncUserPlansAggregate } from '@/shared/lib/firestore/sync-user-plans';
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
    const milestoneTemplates = milestoneTemplatesByPlanType[input.planType];

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
      budgetAmount: input.budgetAmount,
      savingGoalAmount: input.savingGoalAmount,
      savingTargetDate: input.savingTargetDate ? Timestamp.fromDate(input.savingTargetDate) : null,
      status: 'active',
      memberCount: 1,
      milestoneCount: milestoneTemplates.length,
      completedMilestoneCount: 0,
      todoCount: 0,
      completedTodoCount: 0,
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
      nicknameIsCustom: false,
      invitationId: null,
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
      startDate: input.startDate ? Timestamp.fromDate(input.startDate) : null,
      endDate: input.endDate ? Timestamp.fromDate(input.endDate) : null,
      budgetAmount: input.budgetAmount,
      savingGoalAmount: input.savingGoalAmount,
      savingTargetDate: input.savingTargetDate ? Timestamp.fromDate(input.savingTargetDate) : null,
      milestoneCount: milestoneTemplates.length,
      completedMilestoneCount: 0,
      todoCount: 0,
      completedTodoCount: 0,
      totalExpense: 0,
      totalIncome: 0,
      isLocked: false,
      memberCount: 1,
      joinedAt: now,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });

    milestoneTemplates.forEach((template, index) => {
      const milestoneRef = doc(collection(db, 'plans', planRef.id, 'milestones'));

      batch.set(milestoneRef, {
        id: milestoneRef.id,
        planId: planRef.id,
        title: template.title,
        description: null,
        iconId: template.iconId,
        startDate: null,
        endDate: null,
        status: 'upcoming',
        orderIndex: index,
        budgetAmount: null,
        totalExpense: 0,
        todoCount: 0,
        completedTodoCount: 0,
        createdByUserId: input.owner.uid,
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        cancelledAt: null,
      } satisfies MilestoneDocument);
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
    const now = Timestamp.now();
    const planRef = doc(db, 'plans', planId);

    try {
      await updateDoc(planRef, {
        name: input.name,
        description: input.description,
        planType: input.planType,
        startDate: input.startDate ? Timestamp.fromDate(input.startDate) : null,
        endDate: input.endDate ? Timestamp.fromDate(input.endDate) : null,
        budgetAmount: input.budgetAmount,
        savingGoalAmount: input.savingGoalAmount,
        savingTargetDate: input.savingTargetDate ? Timestamp.fromDate(input.savingTargetDate) : null,
        updatedAt: now,
      });
      await syncUserPlansAggregate(planId, {
        planName: input.name,
        planType: input.planType,
        startDate: input.startDate ? Timestamp.fromDate(input.startDate) : null,
        endDate: input.endDate ? Timestamp.fromDate(input.endDate) : null,
        budgetAmount: input.budgetAmount,
        savingGoalAmount: input.savingGoalAmount,
        savingTargetDate: input.savingTargetDate ? Timestamp.fromDate(input.savingTargetDate) : null,
        updatedAt: now,
      });
    } catch (error) {
      console.error('updatePlan failed', error);
      throw mapPlanWriteError(error);
    }
  }

  async closePlan(planId: string) {
    const db = getFirebaseFirestore();
    const now = Timestamp.now();
    const planRef = doc(db, 'plans', planId);

    await updateDoc(planRef, {
      status: 'closed',
      closedAt: now,
      updatedAt: now,
    });
    await syncUserPlansAggregate(planId, { planStatus: 'closed', updatedAt: now });
  }

  async setPlanSecurityForUser(userId: string, planId: string, isLocked: boolean) {
    const db = getFirebaseFirestore();
    const now = Timestamp.now();
    const userPlanRef = doc(db, 'userPlans', userId, 'plans', planId);

    await updateDoc(userPlanRef, { isLocked, updatedAt: now });
  }

  async clearAllPlanSecurityForUser(userId: string) {
    const db = getFirebaseFirestore();
    const now = Timestamp.now();
    const lockedPlansQuery = query(
      collection(db, 'userPlans', userId, 'plans'),
      where('isLocked', '==', true),
    );
    const snapshot = await getDocs(lockedPlansQuery);

    if (snapshot.empty) {
      return;
    }

    const batch = writeBatch(db);

    snapshot.docs.forEach((docSnapshot) => {
      batch.update(docSnapshot.ref, { isLocked: false, updatedAt: now });
    });

    await batch.commit();
  }

  async deletePlan(planId: string, ownerUserId: string) {
    const db = getFirebaseFirestore();
    // Firestore has no cascade delete: every subcollection doc and every
    // member's `userPlans` index copy has to be deleted individually. The
    // owner's OWN `userPlans` doc is what every delete rule below checks via
    // isPlanOwner(), so it must be the very last thing removed — deleting it
    // any earlier would make the owner fail the permission check partway
    // through and abort the rest of the cleanup.
    const subcollectionNames = ['members', 'milestones', 'todos', 'expenses', 'incomes', 'settlements', 'invitations'];

    try {
      const refsToDelete: DocumentReference[] = [];
      const memberUserIds = new Set<string>();

      for (const name of subcollectionNames) {
        const snapshot = await getDocs(collection(db, 'plans', planId, name));

        snapshot.forEach((docSnapshot) => {
          refsToDelete.push(docSnapshot.ref);

          if (name === 'members') {
            const userId = (docSnapshot.data() as { userId?: string | null }).userId;

            if (userId) {
              memberUserIds.add(userId);
            }
          }
        });
      }

      memberUserIds.delete(ownerUserId);
      memberUserIds.forEach((userId) => {
        refsToDelete.push(doc(db, 'userPlans', userId, 'plans', planId));
      });

      const CHUNK_SIZE = 450;

      for (let index = 0; index < refsToDelete.length; index += CHUNK_SIZE) {
        const batch = writeBatch(db);
        refsToDelete.slice(index, index + CHUNK_SIZE).forEach((ref) => batch.delete(ref));
        await batch.commit();
      }

      const finalBatch = writeBatch(db);
      finalBatch.delete(doc(db, 'plans', planId));
      finalBatch.delete(doc(db, 'userPlans', ownerUserId, 'plans', planId));
      await finalBatch.commit();
    } catch (error) {
      console.error('deletePlan failed', error);
      throw mapPlanWriteError(error);
    }
  }

  watchUserPlans(userId: string, callback: (plans: PlanSummary[]) => void, onError?: (error: Error) => void) {
    const plansQuery = query(
      collection(getFirebaseFirestore(), 'userPlans', userId, 'plans'),
      orderBy('updatedAt', 'desc'),
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
