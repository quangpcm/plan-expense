import type {
  WeddingGuestInvitedById,
  WeddingGuestRelationshipId,
  WeddingGuestSideId,
} from '@/modules/wedding-guest/types/wedding-guest';

export const WEDDING_GUEST_SIDES: Array<{
  id: WeddingGuestSideId;
  label: string;
}> = [
  { id: 'bride_family', label: 'Nhà gái' },
  { id: 'groom_family', label: 'Nhà trai' },
  { id: 'shared', label: 'Chung' },
];

export const WEDDING_GUEST_RELATIONSHIPS: Array<{
  id: WeddingGuestRelationshipId;
  label: string;
}> = [
  { id: 'family', label: 'Họ hàng' },
  { id: 'friend', label: 'Bạn bè' },
  { id: 'colleague', label: 'Đồng nghiệp' },
  { id: 'neighbor', label: 'Hàng xóm' },
  { id: 'partner_client', label: 'Đối tác / Khách hàng' },
  { id: 'other', label: 'Khác' },
];

export const WEDDING_GUEST_INVITED_BY: Array<{
  id: WeddingGuestInvitedById;
  label: string;
}> = [
  { id: 'bride', label: 'Cô dâu' },
  { id: 'groom', label: 'Chú rể' },
  { id: 'bride_parents', label: 'Bố mẹ cô dâu' },
  { id: 'groom_parents', label: 'Bố mẹ chú rể' },
  { id: 'shared', label: 'Chung' },
];

export const GUEST_RSVP_OPTIONS: Array<{
  id: 'pending' | 'attending' | 'not_attending';
  label: string;
}> = [
  { id: 'pending', label: 'Chưa xác nhận' },
  { id: 'attending', label: 'Tham dự' },
  { id: 'not_attending', label: 'Không tham dự' },
];

export function getWeddingGuestSideLabel(sideId: WeddingGuestSideId): string {
  return (
    WEDDING_GUEST_SIDES.find((side) => side.id === sideId)?.label ?? sideId
  );
}

export function getWeddingGuestRelationshipLabel(
  relationshipId: WeddingGuestRelationshipId,
): string {
  return (
    WEDDING_GUEST_RELATIONSHIPS.find(
      (relationship) => relationship.id === relationshipId,
    )?.label ?? relationshipId
  );
}

export function getWeddingGuestInvitedByLabel(
  invitedById: WeddingGuestInvitedById,
): string {
  return (
    WEDDING_GUEST_INVITED_BY.find((invitedBy) => invitedBy.id === invitedById)
      ?.label ?? invitedById
  );
}

export function getGuestRsvpLabel(
  rsvp: 'pending' | 'attending' | 'not_attending',
): string {
  return GUEST_RSVP_OPTIONS.find((option) => option.id === rsvp)?.label ?? rsvp;
}
