'use client';

import { FirestoreDebtTrackingRepository } from '@/modules/debt-tracking/repositories/firestore-debt-tracking.repository';
import { DebtTrackingService } from '@/modules/debt-tracking/services/debt-tracking.service';

const debtTrackingRepository = new FirestoreDebtTrackingRepository();

export const debtTrackingService = new DebtTrackingService(debtTrackingRepository);
