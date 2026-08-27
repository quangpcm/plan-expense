import type { Timestamp } from 'firebase/firestore';

import { TODAY_SUMMARY_TTL_MS } from '@/modules/today/constants/today-summary.constants';

export function getDateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export type TodaySummaryFreshnessInput = {
  dateKey: string;
  timezone: string;
  rebuiltAt: Timestamp;
};

export function isTodaySummaryFresh(
  summary: TodaySummaryFreshnessInput,
  params: { now: Date; timezone: string },
): boolean {
  if (summary.timezone !== params.timezone) {
    return false;
  }

  if (summary.dateKey !== getDateKey(params.now, params.timezone)) {
    return false;
  }

  const ageMs = params.now.getTime() - summary.rebuiltAt.toMillis();

  return ageMs < TODAY_SUMMARY_TTL_MS;
}
