import { Timestamp } from 'firebase/firestore';

import type {
  RecentlyCompletedItem,
  TodayContextItem,
  TodaySummaryDocument,
  TodaySummaryItem,
} from '@/modules/today/types/today-summary';

// Kept local to the Today module by design (docs/today-dashboard-specs.md) —
// not a generic app-wide cache abstraction. One key per user; the stored
// value carries dateKey/timezone so staleness/namespace can still be
// validated per the three required dimensions even though the key itself
// already scopes by user.
const CACHE_KEY_PREFIX = 'today-summary:';

// Timestamp doesn't survive JSON.stringify/parse as a class instance, so the
// cached shape stores epoch-ms numbers and reconstructs Timestamp on read.
type SerializedTodaySummaryItem = Omit<TodaySummaryItem, 'dueAt'> & { dueAt: number | null };
type SerializedTodayContextItem = Omit<TodayContextItem, 'startDate' | 'endDate' | 'nextActivity'> & {
  startDate: number;
  endDate: number;
  nextActivity: { title: string; startsAt: number } | null;
};
type SerializedRecentlyCompletedItem = Omit<RecentlyCompletedItem, 'completedAt'> & { completedAt: number };
type SerializedTodaySummaryDocument = Omit<
  TodaySummaryDocument,
  'rebuiltAt' | 'attentionItems' | 'todayItems' | 'upcomingItems' | 'contexts' | 'recentlyCompletedItems'
> & {
  rebuiltAt: number;
  attentionItems: SerializedTodaySummaryItem[];
  todayItems: SerializedTodaySummaryItem[];
  upcomingItems: SerializedTodaySummaryItem[];
  contexts: SerializedTodayContextItem[];
  recentlyCompletedItems: SerializedRecentlyCompletedItem[];
};

type TodaySummaryCacheEntry = {
  userId: string;
  dateKey: string;
  timezone: string;
  cachedAt: number;
  summary: SerializedTodaySummaryDocument;
};

export type ReadTodaySummaryCacheParams = {
  userId: string;
  dateKey: string;
  timezone: string;
};

export type WriteTodaySummaryCacheParams = ReadTodaySummaryCacheParams & {
  summary: TodaySummaryDocument;
  cachedAt: number;
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

function serializeItem(item: TodaySummaryItem): SerializedTodaySummaryItem {
  return { ...item, dueAt: item.dueAt ? item.dueAt.toMillis() : null };
}

function deserializeItem(item: SerializedTodaySummaryItem): TodaySummaryItem {
  return { ...item, dueAt: item.dueAt !== null ? Timestamp.fromMillis(item.dueAt) : null };
}

// Firestore's Timestamp has its own toJSON(), so a naive JSON.stringify wouldn't throw — but the
// value that comes back from JSON.parse would be a plain {seconds,nanoseconds} object, not a real
// Timestamp with .toMillis()/.toDate(), and would break the first render that calls either. Same
// explicit epoch-ms round-trip as serializeItem/deserializeItem above, just for the nested
// nextActivity.startsAt field.
function serializeContext(context: TodayContextItem): SerializedTodayContextItem {
  return {
    ...context,
    startDate: context.startDate.toMillis(),
    endDate: context.endDate.toMillis(),
    nextActivity: context.nextActivity
      ? { title: context.nextActivity.title, startsAt: context.nextActivity.startsAt.toMillis() }
      : null,
  };
}

// Returns null (filtered out by the caller) instead of a broken TodayContextItem when the raw
// entry doesn't actually have the fields this shape requires — e.g. a cache entry written during
// Phase 3 (before 3.1 added startDate/endDate/remainingActivitiesToday) has `startDate: undefined`
// in the raw JSON despite the type claiming `number`. `Timestamp.fromMillis(undefined)` does not
// throw; it silently produces a Timestamp with a NaN internal value, which only surfaces much
// later as "RangeError: Invalid time value" inside formatDate at render time. Validating the raw
// field types here catches it at the actual source instead.
function deserializeContext(context: SerializedTodayContextItem): TodayContextItem | null {
  if (typeof context.startDate !== 'number' || typeof context.endDate !== 'number') {
    return null;
  }

  return {
    ...context,
    startDate: Timestamp.fromMillis(context.startDate),
    endDate: Timestamp.fromMillis(context.endDate),
    remainingActivitiesToday:
      typeof context.remainingActivitiesToday === 'number' ? context.remainingActivitiesToday : 0,
    nextActivity:
      context.nextActivity && typeof context.nextActivity.startsAt === 'number'
        ? { title: context.nextActivity.title, startsAt: Timestamp.fromMillis(context.nextActivity.startsAt) }
        : null,
  };
}

function serializeRecentlyCompletedItem(item: RecentlyCompletedItem): SerializedRecentlyCompletedItem {
  return { ...item, completedAt: item.completedAt.toMillis() };
}

// Same null-safety reasoning as deserializeContext above — a raw cache entry might not actually
// have `completedAt` as a number even though the type says it must (e.g. any future shape change
// to RecentlyCompletedItem). Filtered out by the caller rather than producing a NaN Timestamp.
function deserializeRecentlyCompletedItem(item: SerializedRecentlyCompletedItem): RecentlyCompletedItem | null {
  if (typeof item.completedAt !== 'number') {
    return null;
  }

  return { ...item, completedAt: Timestamp.fromMillis(item.completedAt) };
}

function serializeSummary(summary: TodaySummaryDocument): SerializedTodaySummaryDocument {
  return {
    ...summary,
    rebuiltAt: summary.rebuiltAt.toMillis(),
    attentionItems: summary.attentionItems.map(serializeItem),
    todayItems: summary.todayItems.map(serializeItem),
    upcomingItems: summary.upcomingItems.map(serializeItem),
    // `?? []` / `?? 0` defensively cover a TodaySummaryDocument that reached here without going
    // through buildTodaySummary/the Firestore-read normalization (belt-and-suspenders — see the
    // matching note on deserializeSummary below for the actual backward-compat case this protects
    // against).
    contexts: (summary.contexts ?? []).map(serializeContext),
    completedTodayCount: summary.completedTodayCount ?? 0,
    totalTodayCount: summary.totalTodayCount ?? 0,
    recentlyCompletedItems: (summary.recentlyCompletedItems ?? []).map(serializeRecentlyCompletedItem),
  };
}

function deserializeSummary(summary: SerializedTodaySummaryDocument): TodaySummaryDocument {
  return {
    ...summary,
    rebuiltAt: Timestamp.fromMillis(summary.rebuiltAt),
    attentionItems: summary.attentionItems.map(deserializeItem),
    todayItems: summary.todayItems.map(deserializeItem),
    upcomingItems: summary.upcomingItems.map(deserializeItem),
    // Backward compatibility: a cache entry written by a pre-Phase-3 client has no `contexts` key
    // at all in the raw JSON (`?? []`), and one written during Phase 3 (before 3.1) has `contexts`
    // items missing the newer date fields (deserializeContext returns null for those, filtered out
    // below). Either way the rest of an otherwise-valid cached summary (todos/activities) stays
    // usable instead of being discarded as a full cache miss. No migration/backfill of the stored
    // value itself — it self-heals on the next rebuild.
    contexts: (summary.contexts ?? [])
      .map(deserializeContext)
      .filter((context): context is TodayContextItem => context !== null),
    // Phase 4 — same reasoning: a pre-Phase-4 cache entry has none of these fields at all.
    // completedTodayCount/totalTodayCount both default to 0 (not e.g. todayItems.length) so
    // TodayProgressCard's own "totalTodayCount === 0 → don't render" rule naturally hides Progress
    // for a stale summary instead of showing a denominator that would be wrong.
    completedTodayCount: summary.completedTodayCount ?? 0,
    totalTodayCount: summary.totalTodayCount ?? 0,
    recentlyCompletedItems: (summary.recentlyCompletedItems ?? [])
      .map(deserializeRecentlyCompletedItem)
      .filter((item): item is RecentlyCompletedItem => item !== null),
  };
}

function isPlausibleCacheEntry(value: unknown): value is TodaySummaryCacheEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const entry = value as Record<string, unknown>;

  return (
    typeof entry.userId === 'string' &&
    typeof entry.dateKey === 'string' &&
    typeof entry.timezone === 'string' &&
    typeof entry.cachedAt === 'number' &&
    !!entry.summary &&
    typeof entry.summary === 'object'
  );
}

// Reads and validates all three required namespace dimensions (userId,
// dateKey, timezone) before returning cached data. Any mismatch, missing
// storage, or malformed JSON is a safe cache miss (returns null), never a
// thrown error — this is an optimistic display layer, not a source of truth.
export function readTodaySummaryCache(params: ReadTodaySummaryCacheParams): TodaySummaryDocument | null {
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

  if (!isPlausibleCacheEntry(parsed)) {
    return null;
  }

  if (parsed.userId !== params.userId || parsed.dateKey !== params.dateKey || parsed.timezone !== params.timezone) {
    return null;
  }

  try {
    return deserializeSummary(parsed.summary);
  } catch {
    return null;
  }
}

export function writeTodaySummaryCache(params: WriteTodaySummaryCacheParams): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  const entry: TodaySummaryCacheEntry = {
    userId: params.userId,
    dateKey: params.dateKey,
    timezone: params.timezone,
    cachedAt: params.cachedAt,
    summary: serializeSummary(params.summary),
  };

  try {
    storage.setItem(CACHE_KEY_PREFIX + params.userId, JSON.stringify(entry));
  } catch {
    // Storage full/unavailable — Today's cache is purely an optimization,
    // never a source of truth, so a failed write is safe to ignore.
  }
}
