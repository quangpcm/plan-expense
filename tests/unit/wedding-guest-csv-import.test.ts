import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import {
  buildImportPreview,
  parseWeddingGuestCsv,
} from '@/modules/wedding-guest/utils/wedding-guest-csv-import';
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
    rsvp: 'pending',
    attendeeCount: 1,
    moneyGiftAmount: 1000000,
    goldGiftAmount: null,
    goldGiftNote: null,
    note: null,
    transportArrangement: 'undecided',
    createdByUserId: 'user-1',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

describe('wedding guest csv import', () => {
  it('parses rows, accepts thousand separators, and reports invalid data', () => {
    const csv = [
      'Tên Nhóm Khách,Phía,Quan Hệ,Khách của,Tên khách mời,Trạng thái Xác Nhận,Số người dự kiến,Tiền mừng,Vàng mừng,Giá quy đổi vàng,Ghi chú,Di chuyển',
      'Bạn cô dâu,Nhà gái,Bạn bè,Cô dâu,Nguyen Van A,Tham dự,2,"1.500.000",,,"Mang em bé",Đi cùng nhà gái',
      'Họ nhà trai,Nhà trai,Họ hàng,Chú rể,Tran Thi B,Không tham dự,1,"250,000",,,,',
      ',Nhà trai,Họ hàng,Chú rể,,Không tham dự,1,abc,,,,',
    ].join('\n');

    const result = parseWeddingGuestCsv(csv);

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      attendeeCount: 2,
      moneyGiftAmount: 1500000,
      rsvp: 'attending',
      transportArrangement: 'bride_side',
    });
    expect(result.rows[1]?.moneyGiftAmount).toBe(250000);
    expect(result.rows[1]?.transportArrangement).toBe('undecided');
    expect(result.errors).toHaveLength(1);
  });

  it('rejects an unrecognized transport arrangement label', () => {
    const csv = [
      'Tên Nhóm Khách,Phía,Quan Hệ,Khách của,Tên khách mời,Trạng thái Xác Nhận,Số người dự kiến,Tiền mừng,Vàng mừng,Giá quy đổi vàng,Ghi chú,Di chuyển',
      'Bạn cô dâu,Nhà gái,Bạn bè,Cô dâu,Nguyen Van A,Tham dự,2,1500000,,,,Xe nhà trai',
    ].join('\n');

    const result = parseWeddingGuestCsv(csv);

    expect(result.rows).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toContain('phương tiện di chuyển');
  });

  it('builds preview with new/high/name-only matches, new groups, unchanged and sync rows', () => {
    const csv = [
      'Tên Nhóm Khách,Phía,Quan Hệ,Khách của,Tên khách mời,Trạng thái Xác Nhận,Số người dự kiến,Tiền mừng,Vàng mừng,Giá quy đổi vàng,Ghi chú',
      'Bạn cô dâu,Nhà gái,Bạn bè,Cô dâu,Nguyen Van A,Chưa xác nhận,1,1000000,,,',
      'Nhóm mới,Nhà gái,Bạn bè,Cô dâu,Nguyen Van A,Tham dự,2,2000000,,,',
      'Bạn cô dâu,Nhà trai,Bạn bè,Cô dâu,Nguyen Van A,Tham dự,1,1000000,,,',
      'Nhóm mới 2,Nhà trai,Họ hàng,Chú rể,Le Thi C,Tham dự,3,3000000,2,15 trieu,Ghi chu',
    ].join('\n');

    const parsed = parseWeddingGuestCsv(csv);
    const preview = buildImportPreview(
      parsed.rows,
      [
        makeGuest(),
        makeGuest({
          id: 'guest-2',
          sideId: 'groom_family',
          relationshipId: 'friend',
          invitedById: 'shared',
        }),
      ],
      [makeGroup()],
      [makeInvitation()],
    );

    const highMatch = preview.find((unit) => unit.matchStatus === 'high');
    const nameOnlyMatch = preview.find((unit) => unit.matchStatus === 'name_only');
    const newGuest = preview.find((unit) => unit.matchStatus === 'new');

    expect(highMatch?.invitations[0]?.status).toBe('unchanged');
    expect(highMatch?.invitations[1]).toMatchObject({
      status: 'create',
      isNewGroup: true,
    });
    expect(nameOnlyMatch?.candidateMatches.length).toBeGreaterThan(0);
    expect(newGuest).toMatchObject({
      name: 'Le Thi C',
      matchStatus: 'new',
    });
  });
});
