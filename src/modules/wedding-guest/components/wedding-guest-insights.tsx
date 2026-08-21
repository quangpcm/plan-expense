import { CheckCircle2, Sparkles } from 'lucide-react';

import {
  WEDDING_GUEST_RELATIONSHIPS,
  WEDDING_GUEST_SIDES,
} from '@/modules/wedding-guest/constants/wedding-guest-presets';
import type { GuestInvitationDocument } from '@/modules/wedding-guest/types/guest-invitation';
import type { WeddingGuestDocument } from '@/modules/wedding-guest/types/wedding-guest';
import type { WeddingGuestGroupDocument } from '@/modules/wedding-guest/types/wedding-guest-group';
import {
  calculateGuestStatisticByAttribute,
  calculateGuestStatisticByGroup,
} from '@/modules/wedding-guest/utils/wedding-guest-statistic';
import { Card } from '@/shared/components/ui/card';

type WeddingGuestInsightsProps = {
  guests: WeddingGuestDocument[];
  groups: WeddingGuestGroupDocument[];
  invitations: GuestInvitationDocument[];
};

export function WeddingGuestInsights({
  guests,
  groups,
  invitations,
}: WeddingGuestInsightsProps) {
  const byGroup = calculateGuestStatisticByGroup(groups, invitations);
  const bySide = calculateGuestStatisticByAttribute(
    guests,
    invitations,
    'sideId',
  );
  const byRelationship = calculateGuestStatisticByAttribute(
    guests,
    invitations,
    'relationshipId',
  );

  const totalSideMoney = bySide.reduce(
    (sum, row) => sum + row.moneyGiftTotal,
    0,
  );

  const topGroupByGuests = byGroup.length
    ? byGroup.reduce((top, row) =>
        row.guestCount > top.guestCount ? row : top,
      )
    : null;

  const topSideByMoney = bySide.length
    ? bySide.reduce((top, row) =>
        row.moneyGiftTotal > top.moneyGiftTotal ? row : top,
      )
    : null;

  const topRelationshipByGold = byRelationship
    .filter((row) => row.goldGiftTotal > 0)
    .reduce<(typeof byRelationship)[number] | null>(
      (top, row) => (!top || row.goldGiftTotal > top.goldGiftTotal ? row : top),
      null,
    );

  const insights: string[] = [];

  if (topGroupByGuests && topGroupByGuests.guestCount > 0) {
    insights.push(
      `Nhóm ${topGroupByGuests.group.name} đông khách nhất (${topGroupByGuests.guestCount} khách).`,
    );
  }

  if (topSideByMoney && totalSideMoney > 0) {
    const percent = Math.round(
      (topSideByMoney.moneyGiftTotal / totalSideMoney) * 100,
    );
    const sideLabel =
      WEDDING_GUEST_SIDES.find((side) => side.id === topSideByMoney.attributeId)
        ?.label ?? topSideByMoney.attributeId;
    insights.push(
      `Phía ${sideLabel} đóng góp tiền mừng nhiều nhất (${percent}%).`,
    );
  }

  if (topRelationshipByGold) {
    const relationshipLabel =
      WEDDING_GUEST_RELATIONSHIPS.find(
        (relationship) => relationship.id === topRelationshipByGold.attributeId,
      )?.label ?? topRelationshipByGold.attributeId;
    insights.push(`${relationshipLabel} mừng vàng nhiều nhất.`);
  }

  return (
    <Card className="bg-orange-50">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-orange-500" />
        <p className="text-sm font-semibold text-slate-900">Insights</p>
      </div>
      {insights.length > 0 ? (
        <ul className="space-y-3">
          {insights.map((insight) => (
            <li
              className="flex items-start gap-2 text-sm text-slate-700"
              key={insight}
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-orange-500" />
              {insight}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">
          Chưa có đủ dữ liệu để đưa ra nhận xét.
        </p>
      )}
    </Card>
  );
}
