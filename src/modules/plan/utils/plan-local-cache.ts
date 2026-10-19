import { Timestamp } from 'firebase/firestore';

import type { PlanSummary } from '@/modules/plan/types/plan';

// Mirrors src/modules/today/utils/today-summary-local-cache.ts — optimistic
// display layer only, never a source of truth. One key per user; onSnapshot
// remains the only source of truth and overwrites this on every emission.
const CACHE_KEY_PREFIX = 'user-plans:';

// Timestamp doesn't survive JSON.stringify/parse as a class instance — the
// cached shape stores epoch-ms numbers and reconstructs Timestamp on read.
type SerializedPlanSummary = Omit<
  PlanSummary,
  'startDate' | 'endDate' | 'savingTargetDate' | 'archivedAt' | 'joinedAt' | 'lastActivityAt' | 'createdAt' | 'updatedAt'
> & {
  startDate: number | null;
  endDate: number | null;
  savingTargetDate: number | null;
  archivedAt: number | null;
  joinedAt: number | null;
  lastActivityAt: number;
  createdAt: number;
  updatedAt: number;
};

type PlansCacheEntry = {
  userId: string;
  cachedAt: number;
  plans: SerializedPlanSummary[];
};

export type ReadUserPlansCacheParams = {
  userId: string;
};

export type WriteUserPlansCacheParams = {
  userId: string;
  plans: PlanSummary[];
};

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    // Some environments (privacy mode, disabled storage) throw on access.
    return null;
  }
}

function serializePlan(plan: PlanSummary): SerializedPlanSummary {
  return {
    ...plan,
    startDate: plan.startDate ? plan.startDate.toMillis() : null,
    endDate: plan.endDate ? plan.endDate.toMillis() : null,
    savingTargetDate: plan.savingTargetDate ? plan.savingTargetDate.toMillis() : null,
    archivedAt: plan.archivedAt ? plan.archivedAt.toMillis() : null,
    joinedAt: plan.joinedAt ? plan.joinedAt.toMillis() : null,
    lastActivityAt: plan.lastActivityAt.toMillis(),
    createdAt: plan.createdAt.toMillis(),
    updatedAt: plan.updatedAt.toMillis(),
  };
}

// Returns null (filtered out by the caller) instead of a broken PlanSummary
// when a cache entry written by an older client is missing a required field
// that the current type claims must exist — Timestamp.fromMillis(undefined)
// doesn't throw, it silently produces a NaN timestamp that only surfaces
// much later as a render crash when formatting the date.
function deserializePlan(plan: SerializedPlanSummary): PlanSummary | null {
  if (
    typeof plan.lastActivityAt !== 'number' ||
    typeof plan.createdAt !== 'number' ||
    typeof plan.updatedAt !== 'number'
  ) {
    return null;
  }

  return {
    ...plan,
    startDate: typeof plan.startDate === 'number' ? Timestamp.fromMillis(plan.startDate) : null,
    endDate: typeof plan.endDate === 'number' ? Timestamp.fromMillis(plan.endDate) : null,
    savingTargetDate: typeof plan.savingTargetDate === 'number' ? Timestamp.fromMillis(plan.savingTargetDate) : null,
    archivedAt: typeof plan.archivedAt === 'number' ? Timestamp.fromMillis(plan.archivedAt) : null,
    joinedAt: typeof plan.joinedAt === 'number' ? Timestamp.fromMillis(plan.joinedAt) : null,
    lastActivityAt: Timestamp.fromMillis(plan.lastActivityAt),
    createdAt: Timestamp.fromMillis(plan.createdAt),
    updatedAt: Timestamp.fromMillis(plan.updatedAt),
  };
}

function isPlausibleCacheEntry(value: unknown): value is PlansCacheEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const entry = value as Record<string, unknown>;

  return typeof entry.userId === 'string' && typeof entry.cachedAt === 'number' && Array.isArray(entry.plans);
}

// Any mismatch, missing storage, or malformed JSON is a safe cache miss
// (returns null), never a thrown error.
export function readUserPlansCache(params: ReadUserPlansCacheParams): PlanSummary[] | null {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const raw = storage.getItem(CACHE_KEY_PREFIX + params.userId);

  if (!raw) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isPlausibleCacheEntry(parsed) || parsed.userId !== params.userId) {
    return null;
  }

  try {
    return parsed.plans.map(deserializePlan).filter((plan): plan is PlanSummary => plan !== null);
  } catch {
    return null;
  }
}

export function writeUserPlansCache(params: WriteUserPlansCacheParams): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  const entry: PlansCacheEntry = {
    userId: params.userId,
    cachedAt: Date.now(),
    plans: params.plans.map(serializePlan),
  };

  try {
    storage.setItem(CACHE_KEY_PREFIX + params.userId, JSON.stringify(entry));
  } catch {
    // Storage full/unavailable — this cache is purely an optimization,
    // never a source of truth, so a failed write is safe to ignore.
  }
}
