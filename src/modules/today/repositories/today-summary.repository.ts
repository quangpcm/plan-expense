import type { TodaySummaryDocument } from '@/modules/today/types/today-summary';

export interface TodaySummaryRepository {
  getSummary(userId: string): Promise<TodaySummaryDocument | null>;
  writeSummary(userId: string, summary: TodaySummaryDocument): Promise<void>;
}
