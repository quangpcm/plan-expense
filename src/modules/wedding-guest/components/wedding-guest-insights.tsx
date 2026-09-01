import { CircleAlert, Sparkles, TrendingUp } from 'lucide-react';

import { WEDDING_GUEST_SIDES } from '@/modules/wedding-guest/constants/wedding-guest-presets';
import type { GuestInvitationDocument } from '@/modules/wedding-guest/types/guest-invitation';
import type { WeddingGuestDocument } from '@/modules/wedding-guest/types/wedding-guest';
import {
  calculateGuestStatisticByAttribute,
  calculateOverallGuestStatistic,
} from '@/modules/wedding-guest/utils/wedding-guest-statistic';
import { Card } from '@/shared/components/ui/card';

type WeddingGuestInsightsProps = {
  guests: WeddingGuestDocument[];
  invitations: GuestInvitationDocument[];
};

type Insight = {
  text: string;
  tone: 'action' | 'positive';
};

export function WeddingGuestInsights({
  guests,
  invitations,
}: WeddingGuestInsightsProps) {
  const stat = calculateOverallGuestStatistic(invitations);
  const bySide = calculateGuestStatisticByAttribute(
    guests,
    invitations,
    'sideId',
  );

  const totalInvitations =
    stat.rsvpBreakdown.pending +
    stat.rsvpBreakdown.attending +
    stat.rsvpBreakdown.not_attending;
  const respondedCount =
    stat.rsvpBreakdown.attending + stat.rsvpBreakdown.not_attending;
  const responseRate =
    totalInvitations > 0
      ? Math.round((respondedCount / totalInvitations) * 100)
      : 0;

  const totalSideMoney = bySide.reduce(
    (sum, row) => sum + row.moneyGiftTotal,
    0,
  );
  const topSideByMoney = bySide.length
    ? bySide.reduce((top, row) =>
        row.moneyGiftTotal > top.moneyGiftTotal ? row : top,
      )
    : null;

  const insights: Insight[] = [];

  if (stat.rsvpBreakdown.pending > 0) {
    insights.push({
      text: `${stat.rsvpBreakdown.pending} khách chưa xác nhận.`,
      tone: 'action',
    });
  }

  if (totalInvitations > 0 && responseRate >= 90) {
    insights.push({
      text: `${responseRate}% khách đã phản hồi, gần hoàn tất xác nhận.`,
      tone: 'positive',
    });
  }

  if (topSideByMoney && totalSideMoney > 0) {
    const percent = Math.round(
      (topSideByMoney.moneyGiftTotal / totalSideMoney) * 100,
    );
    const sideLabel =
      WEDDING_GUEST_SIDES.find((side) => side.id === topSideByMoney.attributeId)
        ?.label ?? topSideByMoney.attributeId;
    insights.push({
      text: `Phía ${sideLabel} đóng góp tiền mừng nhiều nhất (${percent}%).`,
      tone: 'positive',
    });
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className="bg-orange-50">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-orange-500" />
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">Insights</p>
      </div>
      <ul className="space-y-3">
        {insights.map((insight) => (
          <li
            className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]"
            key={insight.text}
          >
            {insight.tone === 'action' ? (
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
            ) : (
              <TrendingUp className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            )}
            {insight.text}
          </li>
        ))}
      </ul>
    </Card>
  );
}
