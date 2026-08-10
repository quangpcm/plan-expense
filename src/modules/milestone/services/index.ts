'use client';

import { FirestoreMilestoneRepository } from '@/modules/milestone/repositories/firestore-milestone.repository';
import { MilestoneService } from '@/modules/milestone/services/milestone.service';

const milestoneRepository = new FirestoreMilestoneRepository();

export const milestoneService = new MilestoneService(milestoneRepository);
