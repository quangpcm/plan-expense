'use client';

import { FirestoreGuestInvitationRepository } from '@/modules/wedding-guest/repositories/firestore-guest-invitation.repository';
import { FirestoreWeddingGuestRepository } from '@/modules/wedding-guest/repositories/firestore-wedding-guest.repository';
import { FirestoreWeddingGuestGroupRepository } from '@/modules/wedding-guest/repositories/firestore-wedding-guest-group.repository';
import { GuestInvitationService } from '@/modules/wedding-guest/services/guest-invitation.service';
import { WeddingGuestService } from '@/modules/wedding-guest/services/wedding-guest.service';
import { WeddingGuestGroupService } from '@/modules/wedding-guest/services/wedding-guest-group.service';

const weddingGuestGroupRepository = new FirestoreWeddingGuestGroupRepository();
const weddingGuestRepository = new FirestoreWeddingGuestRepository();
const guestInvitationRepository = new FirestoreGuestInvitationRepository();

export const weddingGuestGroupService = new WeddingGuestGroupService(
  weddingGuestGroupRepository,
);
export const weddingGuestService = new WeddingGuestService(
  weddingGuestRepository,
);
export const guestInvitationService = new GuestInvitationService(
  guestInvitationRepository,
);
