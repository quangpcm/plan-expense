import type { Timestamp } from 'firebase/firestore';

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
};
