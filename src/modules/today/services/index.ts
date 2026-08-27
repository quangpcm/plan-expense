'use client';

import { memberService } from '@/modules/member';
import { planService } from '@/modules/plan';
import { todoService } from '@/modules/todo';
import { travelActivityService } from '@/modules/travel-activity';
import { FirestoreTodaySummaryRepository } from '@/modules/today/repositories/firestore-today-summary.repository';
import { TodaySummaryService } from '@/modules/today/services/today-summary.service';

const todaySummaryRepository = new FirestoreTodaySummaryRepository();

export const todaySummaryService = new TodaySummaryService(
  todaySummaryRepository,
  planService,
  memberService,
  todoService,
  travelActivityService,
);
