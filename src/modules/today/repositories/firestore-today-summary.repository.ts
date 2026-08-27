'use client';

import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import type { TodaySummaryRepository } from '@/modules/today/repositories/today-summary.repository';
import type { RecentlyCompletedItem, TodayContextItem, TodaySummaryDocument } from '@/modules/today/types/today-summary';

function getTodaySummaryDocRef(userId: string) {
  return doc(getFirebaseFirestore(), 'users', userId, 'todaySummary', 'current');
}

// Phase 3.1 added startDate/endDate to TodayContextItem after Phase 3 shipped — a document
// rebuilt by an older client has `contexts` items shaped without them. Firestore doesn't throw on
// a missing field, so a stale item's `startDate` would just be `undefined`, not a real Timestamp;
// checking the actual instance (not trusting the declared type) catches that before it reaches
// `.toDate()` downstream and blows up with "Invalid time value".
function isCompleteTravelContext(context: TodayContextItem): boolean {
  return context.startDate instanceof Timestamp && context.endDate instanceof Timestamp;
}

// Same class of check for Phase 4's RecentlyCompletedItem — a document written before this field
// existed has none at all (handled by `?? []` below); this guards the narrower case of a malformed
// individual item slipping through with a non-Timestamp completedAt.
function isCompleteRecentlyCompletedItem(item: RecentlyCompletedItem): boolean {
  return item.completedAt instanceof Timestamp;
}

export class FirestoreTodaySummaryRepository implements TodaySummaryRepository {
  async getSummary(userId: string) {
    const snapshot = await getDoc(getTodaySummaryDocRef(userId));

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data() as TodaySummaryDocument;

    // Backward compatibility: a summary document written before Phase 3 (Active Context) has no
    // `contexts` field in Firestore at all, and one written during Phase 3 (before 3.1) has
    // `contexts` items missing the newer startDate/endDate/remainingActivitiesToday fields.
    // Normalize here, at the one place a raw snapshot becomes a TodaySummaryDocument, so every
    // downstream consumer (cache write, freshness check, page render) always sees a real,
    // fully-shaped array. No migration/backfill of the stored document itself — a filtered-out
    // stale context just doesn't show until the next rebuild (today-summary.service.ts always
    // sets contexts with the current shape), same as any other TTL-bound disposable read-model.
    //
    // Phase 4 — completedTodayCount/totalTodayCount default to 0 (not e.g. todayItems.length) on a
    // pre-Phase-4 document: with both at 0, TodayProgressCard's own `totalTodayCount === 0 → don't
    // render` rule naturally hides Progress for stale summaries instead of showing a denominator
    // that would be wrong (todayItems mixes in Travel Activity and excludes completed Todos
    // entirely). It self-heals on the next rebuild, same as contexts.
    return {
      ...data,
      contexts: (data.contexts ?? []).filter(isCompleteTravelContext),
      completedTodayCount: data.completedTodayCount ?? 0,
      totalTodayCount: data.totalTodayCount ?? 0,
      recentlyCompletedItems: (data.recentlyCompletedItems ?? []).filter(isCompleteRecentlyCompletedItem),
    };
  }

  async writeSummary(userId: string, summary: TodaySummaryDocument) {
    await setDoc(getTodaySummaryDocRef(userId), summary);
  }
}
