'use client';

import { Timestamp, doc, getDoc, getDocs, onSnapshot, orderBy, query, where, writeBatch } from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import { getPlanCollectionRef, getPlanDocumentRef, getPlanRootRef, queryByPlanCollection } from '@/modules/plan';
import { diffRemovedAttachments } from '@/modules/storage/utils/diff-attachments';
import type {
  CreateTravelActivityPersistenceInput,
  TravelActivityRepository,
  UpdateTravelActivityPersistenceInput,
} from '@/modules/travel-activity/repositories/travel-activity.repository';
import type { TravelActivityDocument } from '@/modules/travel-activity/types/travel-activity';
import type { ExpenseDocument } from '@/modules/expense/types/expense';
import { mapFirebaseError } from '@/shared/utils/firebase-error';

function toTimestamp(value: string) {
  return Timestamp.fromDate(new Date(value));
}

function normalizeTravelActivity(raw: TravelActivityDocument): TravelActivityDocument {
  return {
    ...raw,
    locationMapUrl: raw.locationMapUrl ?? null,
    attachments: raw.attachments ?? [],
  };
}

export class FirestoreTravelActivityRepository implements TravelActivityRepository {
  generateActivityId(planId: string): string {
    return doc(getPlanCollectionRef(getFirebaseFirestore(), planId, 'travelActivities')).id;
  }

  async createActivity(input: CreateTravelActivityPersistenceInput) {
    const db = getFirebaseFirestore();
    const activityRef = getPlanDocumentRef(db, input.planId, 'travelActivities', input.activityId);
    const now = Timestamp.now();

    await writeBatch(db)
      .set(activityRef, {
        id: activityRef.id,
        planId: input.planId,
        title: input.title.trim(),
        locationName: input.locationName?.trim() || null,
        locationMapUrl: input.locationMapUrl?.trim() || null,
        note: input.note?.trim() || null,
        startsAt: toTimestamp(input.startsAt),
        endsAt: input.endsAt ? toTimestamp(input.endsAt) : null,
        participantMemberIds: input.participantMemberIds,
        attachments: input.attachments,
        createdByUserId: input.createdByUserId,
        createdByMemberId: input.createdByMemberId,
        createdAt: now,
        updatedAt: now,
      } satisfies TravelActivityDocument)
      .update(getPlanRootRef(db, input.planId), {
        updatedAt: now,
      })
      .commit();

    return { activityId: activityRef.id };
  }

  async updateActivity(planId: string, input: UpdateTravelActivityPersistenceInput) {
    const db = getFirebaseFirestore();
    const now = Timestamp.now();
    const activityRef = getPlanDocumentRef(db, planId, 'travelActivities', input.activityId);
    const activitySnapshot = await getDoc(activityRef);

    if (!activitySnapshot.exists()) {
      throw new Error('Travel activity not found.');
    }

    const previousActivity = normalizeTravelActivity(activitySnapshot.data() as TravelActivityDocument);
    const orphanedAttachments = diffRemovedAttachments(previousActivity.attachments, input.attachments);

    await writeBatch(db)
      .update(activityRef, {
        title: input.title.trim(),
        locationName: input.locationName?.trim() || null,
        locationMapUrl: input.locationMapUrl?.trim() || null,
        note: input.note?.trim() || null,
        startsAt: toTimestamp(input.startsAt),
        endsAt: input.endsAt ? toTimestamp(input.endsAt) : null,
        participantMemberIds: input.participantMemberIds,
        attachments: input.attachments,
        updatedAt: now,
      })
      .update(getPlanRootRef(db, planId), {
        updatedAt: now,
      })
      .commit();

    return { orphanedAttachments };
  }

  async deleteActivity(planId: string, activityId: string) {
    const db = getFirebaseFirestore();
    const now = Timestamp.now();
    const activityRef = getPlanDocumentRef(db, planId, 'travelActivities', activityId);
    const planRef = getPlanRootRef(db, planId);
    const activitySnapshot = await getDoc(activityRef);
    const previousActivity = activitySnapshot.exists()
      ? normalizeTravelActivity(activitySnapshot.data() as TravelActivityDocument)
      : null;
    const expensesQuery = query(getPlanCollectionRef(db, planId, 'expenses'), where('activityId', '==', activityId));
    const linkedExpensesSnapshot = await getDocs(expensesQuery);
    const batch = writeBatch(db);

    linkedExpensesSnapshot.docs.forEach((expenseSnapshot) => {
      const expense = expenseSnapshot.data() as ExpenseDocument;

      batch.update(expenseSnapshot.ref, {
        activityId: null,
        updatedAt: now,
        version: expense.version + 1,
      });
    });

    await batch
      .delete(activityRef)
      .update(planRef, {
        updatedAt: now,
      })
      .commit();

    return { orphanedAttachments: previousActivity?.attachments ?? [] };
  }

  watchActivities(
    planId: string,
    callback: (activities: TravelActivityDocument[]) => void,
    onError?: (error: Error) => void,
  ) {
    const activitiesQuery = queryByPlanCollection(
      getFirebaseFirestore(),
      planId,
      'travelActivities',
      orderBy('startsAt', 'asc'),
    );

    return onSnapshot(
      activitiesQuery,
      (snapshot) => {
        callback(
          snapshot.docs
            .map((item) => normalizeTravelActivity(item.data() as TravelActivityDocument))
            .sort((left, right) => {
              const startsAtDiff =
                left.startsAt.toMillis() - right.startsAt.toMillis();

              if (startsAtDiff !== 0) {
                return startsAtDiff;
              }

              return left.createdAt.toMillis() - right.createdAt.toMillis();
            }),
        );
      },
      (error) => {
        onError?.(
          mapFirebaseError(error, 'Unable to load travel itinerary activities.', 'TRAVEL_ACTIVITY_WATCH_FAILED'),
        );
      },
    );
  }
}
