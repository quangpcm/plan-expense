'use client';

import { FirestoreTravelActivityRepository } from '@/modules/travel-activity/repositories/firestore-travel-activity.repository';
import { TravelActivityService } from '@/modules/travel-activity/services/travel-activity.service';

const travelActivityRepository = new FirestoreTravelActivityRepository();

export const travelActivityService = new TravelActivityService(travelActivityRepository);
