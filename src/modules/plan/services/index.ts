'use client';

import { FirestorePlanRepository } from '@/modules/plan/repositories/firestore-plan.repository';
import { PlanService } from '@/modules/plan/services/plan.service';

const planRepository = new FirestorePlanRepository();

export const planService = new PlanService(planRepository);

