'use client';

import { Coins, UsersRound, UserRoundCheck, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { formatGoldGift } from '@/modules/wedding-guest/utils/gold-gift';
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
      label: 'Tổng khách',
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
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
      {tiles.map((tile) => (
        <div
          className="flex flex-col gap-1 rounded-2xl bg-slate-50 p-3 lg:gap-2 lg:p-4"
          key={tile.key}
        >
          <div className="flex items-center gap-1.5 text-slate-400 lg:gap-2">
            <tile.icon className="size-3.5 lg:size-4" />
            <p className="text-[10px] uppercase tracking-[0.1em] lg:text-xs lg:tracking-[0.12em]">
              {tile.label}
            </p>
          </div>
          <p className="truncate text-lg font-semibold text-slate-950 lg:text-2xl">
            {tile.value}
          </p>
        </div>
      ))}
    </div>
  );
}
