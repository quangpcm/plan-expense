import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import { buildWeddingGuestCsv } from '@/modules/wedding-guest/utils/wedding-guest-csv-export';
import type { GuestInvitationDocument } from '@/modules/wedding-guest/types/guest-invitation';
import type { WeddingGuestGroupDocument } from '@/modules/wedding-guest/types/wedding-guest-group';
import type { WeddingGuestDocument } from '@/modules/wedding-guest/types/wedding-guest';

function makeGuest(overrides: Partial<WeddingGuestDocument> = {}): WeddingGuestDocument {
  return {
    id: 'guest-1',
    planId: 'plan-1',
    name: 'Nguyen Van A',
    normalizedName: 'nguyen van a',
    sideId: 'bride_family',
    relationshipId: 'friend',
    invitedById: 'bride',
    createdByUserId: 'user-1',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

function makeGroup(overrides: Partial<WeddingGuestGroupDocument> = {}): WeddingGuestGroupDocument {
  return {
    id: 'group-1',
    planId: 'plan-1',
    name: 'Bạn cô dâu',
    createdByUserId: 'user-1',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

function makeInvitation(
  overrides: Partial<GuestInvitationDocument> = {},
): GuestInvitationDocument {
  return {
    id: 'guest-1_group-1',
    planId: 'plan-1',
    guestId: 'guest-1',
    groupId: 'group-1',
    rsvp: 'attending',
    attendeeCount: 2,
    moneyGiftAmount: 1000000,
    goldGiftAmount: 5,
    goldGiftNote: '15 trieu/chi',
    note: 'An chay',
    createdByUserId: 'user-1',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

describe('buildWeddingGuestCsv', () => {
  it('exports one csv row per invitation with vietnamese headers and labels', () => {
    const csv = buildWeddingGuestCsv(
      [makeGuest(), makeGuest({ id: 'guest-2', name: 'Tran Thi B', normalizedName: 'tran thi b' })],
      [makeGroup(), makeGroup({ id: 'group-2', name: 'Họ nhà trai' })],
      [
        makeInvitation(),
        makeInvitation({
          id: 'guest-2_group-2',
          guestId: 'guest-2',
          groupId: 'group-2',
          rsvp: 'pending',
          attendeeCount: 1,
          moneyGiftAmount: null,
          goldGiftAmount: null,
          goldGiftNote: null,
          note: null,
        }),
      ],
    );

    const lines = csv.trim().split('\n');

    expect(lines[0]).toContain('Tên Nhóm Khách');
    expect(lines[0]).toContain('Trạng thái Xác Nhận');
    expect(lines).toHaveLength(3);
    expect(csv).toContain('Bạn cô dâu');
    expect(csv).toContain('Nhà gái');
    expect(csv).toContain('Chưa xác nhận');
  });
});
