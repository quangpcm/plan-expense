import type { Timestamp } from 'firebase/firestore';

import type { TodoPriority } from '@/modules/todo/types/todo';
import type { DueUrgency } from '@/shared/utils/date';

export type TodaySummaryItemKind = 'todo' | 'travelActivity';

export type TodaySummaryItem = {
  kind: TodaySummaryItemKind;
  planId: string;
  planName: string;
  itemId: string;
  title: string;
  dueAt: Timestamp | null;
  urgency: DueUrgency;
  // Phase 2 (Priority ranking) addition — the source Todo document already carries `priority`
  // (fetched from Firestore either way), this just threads the one scalar through instead of
  // recomputing/re-fetching it. `null` for Travel Activity, which has no priority concept.
  priority: TodoPriority | null;
};

// Phase 3 (Active Context) addition — Travel-only for V1 (see today-context.ts for the scoping
// note on why Wedding/Event aren't included yet). `kind` stays a single literal until a second
// variant actually exists — no premature union/switch scaffolding.
export type TodayContextItem = {
  kind: 'travel';
  planId: string;
  planName: string;
  currentDay: number;
  totalDays: number;
  startDate: Timestamp;
  endDate: Timestamp;
  nextActivity: { title: string; startsAt: Timestamp } | null;
  // Phase 3.1 — count of this plan's today activities that haven't started yet (includes
  // nextActivity itself when present), so the card can show "N việc khác hôm nay" from data
  // already fetched, with no additional query.
  remainingActivitiesToday: number;
};

// Phase 4 (Progress + Recently Completed) addition — Todo-only V1 (Travel Activity is explicitly
// out of scope, see today-progress.ts).
export type RecentlyCompletedItem = {
  planId: string;
  planName: string;
  todoId: string;
  title: string;
  completedAt: Timestamp;
};

export type TodaySummaryDocument = {
  userId: string;
  dateKey: string;
  timezone: string;
  rebuiltAt: Timestamp;
  sourcePlanIds: string[];
  attentionItems: TodaySummaryItem[];
  todayItems: TodaySummaryItem[];
  upcomingItems: TodaySummaryItem[];
  contexts: TodayContextItem[];
  // Phase 4 — completedTodayCount + remainingToday (Todo-only) is the progress denominator; see
  // today-progress.ts buildTodayProgress for why this can never be todayItems.length.
  completedTodayCount: number;
  totalTodayCount: number;
  recentlyCompletedItems: RecentlyCompletedItem[];
};
