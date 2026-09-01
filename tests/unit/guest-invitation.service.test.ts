import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import type { GuestInvitationRepository } from '@/modules/wedding-guest/repositories/guest-invitation.repository';
import { GuestInvitationService } from '@/modules/wedding-guest/services/guest-invitation.service';
import type { AuthUser } from '@/modules/auth/types/auth';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';

const plan = { id: 'plan-1', status: 'active' } as PlanDocument;

const currentUser: AuthUser = {
  uid: 'user-1',
  email: null,
  displayName: null,
  photoURL: null,
};

function makeMember(
  overrides: Partial<PlanMemberDocument> = {},
): PlanMemberDocument {
  return {
    id: 'member-1',
    planId: 'plan-1',
    memberType: 'registered',
    userId: 'user-1',
    email: 'user@example.com',
    nickname: 'Member',
    nicknameIsCustom: false,
    invitationId: null,
    avatarUrl: null,
    role: 'owner',
    permissions: { moduleAccess: {} },
    status: 'active',
    invitedAt: null,
    joinedAt: Timestamp.now(),
    removedAt: null,
    createdByUserId: 'user-1',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

function makeRepository() {
  const addInvitationCalls: Parameters<
    GuestInvitationRepository['addInvitation']
  >[0][] = [];
  const updateInvitationCalls: Parameters<
    GuestInvitationRepository['updateInvitation']
  >[1][] = [];

  const repository: GuestInvitationRepository = {
    async addInvitation(input) {
      addInvitationCalls.push(input);
      return { invitationId: 'invitation-1' };
    },
    async bulkUpsertInvitations() {},
    async updateInvitation(_planId, input) {
      updateInvitationCalls.push(input);
    },
    async deleteInvitation() {},
    watchInvitations() {
      return () => {};
    },
  };

  return { repository, addInvitationCalls, updateInvitationCalls };
}

describe('GuestInvitationService', () => {
  it('defaults a new invitation to undecided when transportArrangement is not provided', async () => {
    const { repository, addInvitationCalls } = makeRepository();
    const service = new GuestInvitationService(repository);

    await service.addInvitation(
      plan,
      { guestId: 'guest-1', groupId: 'group-1', rsvp: 'pending', attendeeCount: 1 },
      currentUser,
      makeMember(),
    );

    expect(addInvitationCalls[0]?.transportArrangement).toBe('undecided');
  });

  it('persists a selected transportArrangement on create', async () => {
    const { repository, addInvitationCalls } = makeRepository();
    const service = new GuestInvitationService(repository);

    await service.addInvitation(
      plan,
      {
        guestId: 'guest-1',
        groupId: 'group-1',
        rsvp: 'pending',
        attendeeCount: 1,
        transportArrangement: 'groom_side',
      },
      currentUser,
      makeMember(),
    );

    expect(addInvitationCalls[0]?.transportArrangement).toBe('groom_side');
  });

  it('persists a selected transportArrangement on update, defaulting to undecided when omitted', async () => {
    const { repository, updateInvitationCalls } = makeRepository();
    const service = new GuestInvitationService(repository);

    await service.updateInvitation(
      plan,
      {
        invitationId: 'invitation-1',
        rsvp: 'attending',
        attendeeCount: 2,
        transportArrangement: 'self_arranged',
      },
      makeMember(),
    );

    expect(updateInvitationCalls[0]?.transportArrangement).toBe('self_arranged');

    await service.updateInvitation(
      plan,
      { invitationId: 'invitation-1', rsvp: 'attending', attendeeCount: 2 },
      makeMember(),
    );

    expect(updateInvitationCalls[1]?.transportArrangement).toBe('undecided');
  });
});
