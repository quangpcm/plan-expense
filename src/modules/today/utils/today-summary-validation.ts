import type { TodaySummaryDocument } from '@/modules/today/types/today-summary';
import { isTodaySummaryFresh } from '@/modules/today/utils/today-summary-freshness';

export interface TodaySummaryValidationSource {
  getSummary(userId: string): Promise<TodaySummaryDocument | null>;
  rebuild(userId: string, params: { now: Date; timezone: string }): Promise<TodaySummaryDocument>;
}

export type ValidateTodaySummaryParams = {
  userId: string;
  timezone: string;
  dateKey: string;
  now: Date;
};

// Module-scoped, not exported — dedupes concurrent validate/rebuild calls for
// the same (userId, dateKey) so React's dev-mode double-invoked effects (or
// multiple mounted instances of useTodaySummary) never trigger overlapping
// Firestore rebuilds. Deliberately scoped to this one function, not a
// generic request-dedup utility.
const inFlightValidations = new Map<string, Promise<TodaySummaryDocument>>();

// Read Firestore once; if fresh, use it as-is. If missing or stale, rebuild
// and return the freshly rebuilt summary. Never opens a listener.
export function validateTodaySummary(
  source: TodaySummaryValidationSource,
  params: ValidateTodaySummaryParams,
): Promise<TodaySummaryDocument> {
  const key = `${params.userId}:${params.dateKey}`;
  const existing = inFlightValidations.get(key);

  if (existing) {
    return existing;
  }

  const promise = (async () => {
    const remote = await source.getSummary(params.userId);

    if (remote && isTodaySummaryFresh(remote, { now: params.now, timezone: params.timezone })) {
      return remote;
    }

    return source.rebuild(params.userId, { now: params.now, timezone: params.timezone });
  })();

  inFlightValidations.set(key, promise);

  const clearInFlight = () => {
    if (inFlightValidations.get(key) === promise) {
      inFlightValidations.delete(key);
    }
  };

  // Both branches handled explicitly (not .finally()) so this cleanup chain
  // doesn't itself become an unhandled-rejection — the original `promise`
  // returned below still carries its own rejection for the caller to handle.
  promise.then(clearInFlight, clearInFlight);

  return promise;
}
