'use client';

import { Coins, UsersRound, UserRoundCheck, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { formatGoldGift } from '@/modules/wedding-guest/utils/gold-gift';
import { Metric } from '@/shared/components/ui/metric';
import { MetricGroup } from '@/shared/components/ui/metric-group';
import { formatCurrency } from '@/shared/utils/currency';

type WeddingGuestStatTilesProps = {
  guestCount: number;
  attendeeCount: number;
  moneyGiftTotal: number;
  goldGiftTotal: number;
};

type Tile = {
  key: string;
  label: string;
  value: string;
  icon: LucideIcon;
};

export function WeddingGuestStatTiles({
  guestCount,
  attendeeCount,
  moneyGiftTotal,
  goldGiftTotal,
}: WeddingGuestStatTilesProps) {
  const tiles: Tile[] = [
    {
      key: 'guests',
      label: 'Khách mời',
      value: String(guestCount),
      icon: UsersRound,
    },
    {
      key: 'attendees',
      label: 'Dự kiến tham dự',
      value: String(attendeeCount),
      icon: UserRoundCheck,
    },
    {
      key: 'money',
      label: 'Tiền mừng',
      value: formatCurrency(moneyGiftTotal),
      icon: Wallet,
    },
    {
      key: 'gold',
      label: 'Vàng mừng',
      value: formatGoldGift(goldGiftTotal),
      icon: Coins,
    },
  ];

  return (
    <MetricGroup columns={4} density="compact">
      {tiles.map((tile) => (
        <Metric
          className="rounded-2xl bg-[var(--color-surface-subtle)] p-3 lg:p-4"
          key={tile.key}
          label={tile.label}
          leading={<tile.icon className="size-3.5 text-[var(--color-text-muted)] lg:size-4" />}
          size="sm"
          value={tile.value}
        />
      ))}
    </MetricGroup>
  );
}
