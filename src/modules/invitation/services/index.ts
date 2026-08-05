'use client';

import { FirestoreInvitationRepository } from '@/modules/invitation/repositories/firestore-invitation.repository';
import { InvitationService } from '@/modules/invitation/services/invitation.service';

const invitationRepository = new FirestoreInvitationRepository();

export const invitationService = new InvitationService(invitationRepository);

