'use client';

import { Timestamp, doc, onSnapshot, orderBy, writeBatch } from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import { getPlanCollectionRef, getPlanDocumentRef, getPlanRootRef, queryByPlanCollection } from '@/modules/plan';
import type {
  CreateTravelActivityPersistenceInput,
  TravelActivityRepository,
  UpdateTravelActivityPersistenceInput,
} from '@/modules/travel-activity/repositories/travel-activity.repository';
import type { TravelActivityDocument } from '@/modules/travel-activity/types/travel-activity';
import { mapFirebaseError } from '@/shared/utils/firebase-error';

function toTimestamp(value: string) {
  return Timestamp.fromDate(new Date(value));
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
        note: input.note?.trim() || null,
        startsAt: toTimestamp(input.startsAt),
        endsAt: input.endsAt ? toTimestamp(input.endsAt) : null,
        participantMemberIds: input.participantMemberIds,
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

    await writeBatch(db)
      .update(getPlanDocumentRef(db, planId, 'travelActivities', input.activityId), {
        title: input.title.trim(),
        locationName: input.locationName?.trim() || null,
        note: input.note?.trim() || null,
        startsAt: toTimestamp(input.startsAt),
        endsAt: input.endsAt ? toTimestamp(input.endsAt) : null,
        participantMemberIds: input.participantMemberIds,
        updatedAt: now,
      })
      .update(getPlanRootRef(db, planId), {
        updatedAt: now,
      })
      .commit();
  }

  async deleteActivity(planId: string, activityId: string) {
    const db = getFirebaseFirestore();
    const now = Timestamp.now();

    await writeBatch(db)
      .delete(getPlanDocumentRef(db, planId, 'travelActivities', activityId))
      .update(getPlanRootRef(db, planId), {
        updatedAt: now,
      })
      .commit();
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
            .map((item) => item.data() as TravelActivityDocument)
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
