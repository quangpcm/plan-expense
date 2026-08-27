import { Timestamp } from 'firebase/firestore';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { TodaySummaryDocument } from '@/modules/today/types/today-summary';
import { readTodaySummaryCache, writeTodaySummaryCache } from '@/modules/today/utils/today-summary-local-cache';

// vitest.config.ts runs tests in a plain Node environment (no jsdom) — this
// repo has no jsdom/testing-library dependency anywhere (confirmed: every
// existing .tsx test uses react-dom/server's renderToStaticMarkup, which
// needs no DOM). A minimal in-memory Storage stands in for
// window.localStorage here rather than pulling in jsdom for one test file.
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

let memoryStorage: Storage;

beforeEach(() => {
  memoryStorage = createMemoryStorage();
  (globalThis as { window?: { localStorage: Storage } }).window = { localStorage: memoryStorage };
});

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

const namespace = { userId: 'user-1', dateKey: '2026-08-26', timezone: 'Asia/Ho_Chi_Minh' };

function makeSummary(overrides: Partial<TodaySummaryDocument> = {}): TodaySummaryDocument {
  return {
    userId: namespace.userId,
    dateKey: namespace.dateKey,
    timezone: namespace.timezone,
    rebuiltAt: Timestamp.fromMillis(1_700_000_000_000),
    sourcePlanIds: ['plan-1'],
    attentionItems: [
      {
        kind: 'todo',
        planId: 'plan-1',
        planName: 'Plan One',
        itemId: 'todo-1',
        title: 'Overdue todo',
        dueAt: Timestamp.fromMillis(1_699_000_000_000),
        urgency: 'overdue',
      },
    ],
    todayItems: [],
    upcomingItems: [],
    ...overrides,
  };
}

describe('readTodaySummaryCache / writeTodaySummaryCache', () => {
  it('round-trips a valid cache write/read for the same namespace, preserving Timestamp fields', () => {
    const summary = makeSummary();
    writeTodaySummaryCache({ ...namespace, summary, cachedAt: Date.now() });

    const result = readTodaySummaryCache(namespace);

    expect(result).not.toBeNull();
    expect(result?.userId).toBe(namespace.userId);
    expect(result?.attentionItems).toHaveLength(1);
    expect(result?.attentionItems[0]?.dueAt).toBeInstanceOf(Timestamp);
    expect(result?.attentionItems[0]?.dueAt?.toMillis()).toBe(1_699_000_000_000);
    expect(result?.rebuiltAt).toBeInstanceOf(Timestamp);
    expect(result?.rebuiltAt.toMillis()).toBe(1_700_000_000_000);
  });

  it('returns null on a userId mismatch (cache miss, no throw)', () => {
    writeTodaySummaryCache({ ...namespace, summary: makeSummary(), cachedAt: Date.now() });

    expect(readTodaySummaryCache({ ...namespace, userId: 'someone-else' })).toBeNull();
  });

  it('returns null on a dateKey mismatch (day rolled over)', () => {
    writeTodaySummaryCache({ ...namespace, summary: makeSummary(), cachedAt: Date.now() });

    expect(readTodaySummaryCache({ ...namespace, dateKey: '2026-08-27' })).toBeNull();
  });

  it('returns null on a timezone mismatch', () => {
    writeTodaySummaryCache({ ...namespace, summary: makeSummary(), cachedAt: Date.now() });

    expect(readTodaySummaryCache({ ...namespace, timezone: 'America/Los_Angeles' })).toBeNull();
  });

  it('validates the embedded userId field even when the storage key matches (defense in depth)', () => {
    // Simulates corrupted/tampered storage: correct key, but the stored
    // value's own userId field disagrees with the key/namespace being read.
    memoryStorage.setItem(
      `today-summary:${namespace.userId}`,
      JSON.stringify({
        userId: 'a-different-user',
        dateKey: namespace.dateKey,
        timezone: namespace.timezone,
        cachedAt: Date.now(),
        summary: { ...makeSummary(), rebuiltAt: 1_700_000_000_000, attentionItems: [], todayItems: [], upcomingItems: [] },
      }),
    );

    expect(readTodaySummaryCache(namespace)).toBeNull();
  });

  it('returns null and does not throw on malformed JSON', () => {
    memoryStorage.setItem(`today-summary:${namespace.userId}`, 'not-json{{{');

    expect(() => readTodaySummaryCache(namespace)).not.toThrow();
    expect(readTodaySummaryCache(namespace)).toBeNull();
  });

  it('returns null and does not throw on structurally implausible JSON (missing fields)', () => {
    memoryStorage.setItem(`today-summary:${namespace.userId}`, JSON.stringify({ foo: 'bar' }));

    expect(readTodaySummaryCache(namespace)).toBeNull();
  });

  it('returns null when nothing has been cached yet', () => {
    expect(readTodaySummaryCache(namespace)).toBeNull();
  });

  it('returns null when window/localStorage is unavailable (SSR-safe)', () => {
    delete (globalThis as { window?: unknown }).window;

    expect(() => readTodaySummaryCache(namespace)).not.toThrow();
    expect(readTodaySummaryCache(namespace)).toBeNull();
    expect(() => writeTodaySummaryCache({ ...namespace, summary: makeSummary(), cachedAt: Date.now() })).not.toThrow();
  });

  it('a later write for the same user overwrites the earlier one (no history retained)', () => {
    writeTodaySummaryCache({ ...namespace, summary: makeSummary({ sourcePlanIds: ['plan-old'] }), cachedAt: Date.now() });
    writeTodaySummaryCache({ ...namespace, summary: makeSummary({ sourcePlanIds: ['plan-new'] }), cachedAt: Date.now() });

    expect(readTodaySummaryCache(namespace)?.sourcePlanIds).toEqual(['plan-new']);
  });
});
