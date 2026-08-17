import type {
  GuestInvitationDocument,
  GuestRsvpStatus,
} from '@/modules/wedding-guest/types/guest-invitation';
import type { WeddingGuestDocument } from '@/modules/wedding-guest/types/wedding-guest';
import type { WeddingGuestGroupDocument } from '@/modules/wedding-guest/types/wedding-guest-group';

export type GuestRsvpBreakdown = Record<GuestRsvpStatus, number>;

export type GuestAggregateStatistic = {
  guestCount: number;
  attendeeCount: number;
  moneyGiftTotal: number;
  goldGiftTotal: number;
  rsvpBreakdown: GuestRsvpBreakdown;
};

function createEmptyRsvpBreakdown(): GuestRsvpBreakdown {
  return { pending: 0, attending: 0, not_attending: 0 };
}

function aggregateInvitations(
  invitations: GuestInvitationDocument[],
): GuestAggregateStatistic {
  const rsvpBreakdown = createEmptyRsvpBreakdown();
  const guestIds = new Set<string>();
  let attendeeCount = 0;
  let moneyGiftTotal = 0;
  let goldGiftTotal = 0;

  for (const invitation of invitations) {
    guestIds.add(invitation.guestId);
    attendeeCount += invitation.attendeeCount;
    moneyGiftTotal += invitation.moneyGiftAmount ?? 0;
    goldGiftTotal += invitation.goldGiftAmount ?? 0;
    rsvpBreakdown[invitation.rsvp] += 1;
  }

  return {
    guestCount: guestIds.size,
    attendeeCount,
    moneyGiftTotal,
    goldGiftTotal,
    rsvpBreakdown,
  };
}

export function calculateOverallGuestStatistic(
  invitations: GuestInvitationDocument[],
): GuestAggregateStatistic {
  return aggregateInvitations(invitations);
}

export function calculateGuestStatisticByGroup(
  groups: WeddingGuestGroupDocument[],
  invitations: GuestInvitationDocument[],
): Array<{ group: WeddingGuestGroupDocument } & GuestAggregateStatistic> {
  return groups.map((group) => ({
    group,
    ...aggregateInvitations(
      invitations.filter((invitation) => invitation.groupId === group.id),
    ),
  }));
}

type GuestAttributeKey = 'sideId' | 'relationshipId' | 'invitedById';

export function calculateGuestStatisticByAttribute(
  guests: WeddingGuestDocument[],
  invitations: GuestInvitationDocument[],
  attributeKey: GuestAttributeKey,
): Array<{ attributeId: string } & GuestAggregateStatistic> {
  const guestById = new Map(guests.map((guest) => [guest.id, guest]));
  const invitationsByAttribute = new Map<string, GuestInvitationDocument[]>();

  for (const invitation of invitations) {
    const guest = guestById.get(invitation.guestId);

    if (!guest) {
      continue;
    }

    const attributeId = guest[attributeKey];
    const bucket = invitationsByAttribute.get(attributeId) ?? [];
    bucket.push(invitation);
    invitationsByAttribute.set(attributeId, bucket);
  }

  return Array.from(invitationsByAttribute.entries()).map(
    ([attributeId, bucketInvitations]) => ({
      attributeId,
      ...aggregateInvitations(bucketInvitations),
    }),
  );
}
