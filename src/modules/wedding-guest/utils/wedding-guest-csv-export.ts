import Papa from 'papaparse';

import {
  getGuestRsvpLabel,
  getWeddingGuestInvitedByLabel,
  getWeddingGuestRelationshipLabel,
  getWeddingGuestSideLabel,
} from '@/modules/wedding-guest/constants/wedding-guest-presets';
import type { GuestInvitationDocument } from '@/modules/wedding-guest/types/guest-invitation';
import type { WeddingGuestGroupDocument } from '@/modules/wedding-guest/types/wedding-guest-group';
import type { WeddingGuestDocument } from '@/modules/wedding-guest/types/wedding-guest';

export const WEDDING_GUEST_CSV_HEADERS = [
  'Tên Nhóm Khách',
  'Phía',
  'Quan Hệ',
  'Khách của',
  'Tên khách mời',
  'Trạng thái Xác Nhận',
  'Số người dự kiến',
  'Tiền mừng',
  'Vàng mừng',
  'Giá quy đổi vàng',
  'Ghi chú',
] as const;

type BuildWeddingGuestCsvOptions = {
  groupId?: string;
};

export function buildWeddingGuestCsv(
  guests: WeddingGuestDocument[],
  groups: WeddingGuestGroupDocument[],
  invitations: GuestInvitationDocument[],
  options: BuildWeddingGuestCsvOptions = {},
): string {
  const guestById = new Map(guests.map((guest) => [guest.id, guest]));
  const groupById = new Map(groups.map((group) => [group.id, group]));

  const rows = invitations
    .filter((invitation) =>
      options.groupId ? invitation.groupId === options.groupId : true,
    )
    .map((invitation) => {
      const guest = guestById.get(invitation.guestId);
      const group = groupById.get(invitation.groupId);

      if (!guest || !group) {
        return null;
      }

      return {
        [WEDDING_GUEST_CSV_HEADERS[0]]: group.name,
        [WEDDING_GUEST_CSV_HEADERS[1]]: getWeddingGuestSideLabel(guest.sideId),
        [WEDDING_GUEST_CSV_HEADERS[2]]: getWeddingGuestRelationshipLabel(
          guest.relationshipId,
        ),
        [WEDDING_GUEST_CSV_HEADERS[3]]: getWeddingGuestInvitedByLabel(
          guest.invitedById,
        ),
        [WEDDING_GUEST_CSV_HEADERS[4]]: guest.name,
        [WEDDING_GUEST_CSV_HEADERS[5]]: getGuestRsvpLabel(invitation.rsvp),
        [WEDDING_GUEST_CSV_HEADERS[6]]: invitation.attendeeCount,
        [WEDDING_GUEST_CSV_HEADERS[7]]: invitation.moneyGiftAmount ?? '',
        [WEDDING_GUEST_CSV_HEADERS[8]]: invitation.goldGiftAmount ?? '',
        [WEDDING_GUEST_CSV_HEADERS[9]]: invitation.goldGiftNote ?? '',
        [WEDDING_GUEST_CSV_HEADERS[10]]: invitation.note ?? '',
      };
    })
    .filter((row) => Boolean(row));

  return Papa.unparse(rows, {
    columns: [...WEDDING_GUEST_CSV_HEADERS],
  });
}

export function buildWeddingGuestCsvFileContent(
  guests: WeddingGuestDocument[],
  groups: WeddingGuestGroupDocument[],
  invitations: GuestInvitationDocument[],
  options: BuildWeddingGuestCsvOptions = {},
): string {
  return `\uFEFF${buildWeddingGuestCsv(guests, groups, invitations, options)}`;
}
