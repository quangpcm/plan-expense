import { Timestamp } from 'firebase/firestore';

import type { TodaySummaryDocument, TodaySummaryItem } from '@/modules/today/types/today-summary';

// Kept local to the Today module by design (docs/today-dashboard-specs.md) —
// not a generic app-wide cache abstraction. One key per user; the stored
// value carries dateKey/timezone so staleness/namespace can still be
// validated per the three required dimensions even though the key itself
// already scopes by user.
const CACHE_KEY_PREFIX = 'today-summary:';

// Timestamp doesn't survive JSON.stringify/parse as a class instance, so the
// cached shape stores epoch-ms numbers and reconstructs Timestamp on read.
type SerializedTodaySummaryItem = Omit<TodaySummaryItem, 'dueAt'> & { dueAt: number | null };
type SerializedTodaySummaryDocument = Omit<
  TodaySummaryDocument,
  'rebuiltAt' | 'attentionItems' | 'todayItems' | 'upcomingItems'
> & {
  rebuiltAt: number;
  attentionItems: SerializedTodaySummaryItem[];
  todayItems: SerializedTodaySummaryItem[];
  upcomingItems: SerializedTodaySummaryItem[];
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

function serializeSummary(summary: TodaySummaryDocument): SerializedTodaySummaryDocument {
  return {
    ...summary,
    rebuiltAt: summary.rebuiltAt.toMillis(),
    attentionItems: summary.attentionItems.map(serializeItem),
    todayItems: summary.todayItems.map(serializeItem),
    upcomingItems: summary.upcomingItems.map(serializeItem),
  };
}

function deserializeSummary(summary: SerializedTodaySummaryDocument): TodaySummaryDocument {
  return {
    ...summary,
    rebuiltAt: Timestamp.fromMillis(summary.rebuiltAt),
    attentionItems: summary.attentionItems.map(deserializeItem),
    todayItems: summary.todayItems.map(deserializeItem),
    upcomingItems: summary.upcomingItems.map(deserializeItem),
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
