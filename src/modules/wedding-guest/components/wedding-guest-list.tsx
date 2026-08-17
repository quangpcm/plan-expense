'use client';

import { Coins, Trash2, UsersRound, Wallet } from 'lucide-react';

import {
  getGuestRsvpLabel,
  getWeddingGuestInvitedByLabel,
  getWeddingGuestRelationshipLabel,
  getWeddingGuestSideLabel,
} from '@/modules/wedding-guest/constants/wedding-guest-presets';
import type { GuestInvitationDocument } from '@/modules/wedding-guest/types/guest-invitation';
import type { WeddingGuestDocument } from '@/modules/wedding-guest/types/wedding-guest';
import { formatGoldGift } from '@/modules/wedding-guest/utils/gold-gift';
import { Badge } from '@/shared/components/ui/badge';
import { formatCurrency } from '@/shared/utils/currency';

export type WeddingGuestListRow = {
  guest: WeddingGuestDocument;
  invitation?: GuestInvitationDocument;
  groupCount?: number;
};

const rsvpBadgeVariant = {
  pending: 'neutral',
  attending: 'success',
  not_attending: 'danger',
} as const;

type WeddingGuestListProps = {
  rows: WeddingGuestListRow[];
  emptyMessage: string;
  onSelectRow: (row: WeddingGuestListRow) => void;
  onDeleteGuest?: ((guest: WeddingGuestDocument) => void) | undefined;
};

export function WeddingGuestList({
  rows,
  emptyMessage,
  onSelectRow,
  onDeleteGuest,
}: WeddingGuestListProps) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((row) => {
        const { guest, invitation, groupCount } = row;

        return (
          <li className="flex items-center gap-2" key={guest.id}>
            <button
              className="min-w-0 flex-1 rounded-2xl bg-slate-50 p-4 text-left transition hover:bg-slate-100"
              onClick={() => onSelectRow(row)}
              type="button"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-slate-950">
                  {guest.name}
                </p>
                {invitation ? (
                  <Badge variant={rsvpBadgeVariant[invitation.rsvp]}>
                    {getGuestRsvpLabel(invitation.rsvp)}
                  </Badge>
                ) : null}
                {groupCount !== undefined ? (
                  <Badge variant="info">{groupCount} nhóm</Badge>
                ) : null}
              </div>
              <p className="mt-1 truncate text-xs text-slate-500">
                {getWeddingGuestSideLabel(guest.sideId)} •{' '}
                {getWeddingGuestRelationshipLabel(guest.relationshipId)} •{' '}
                {getWeddingGuestInvitedByLabel(guest.invitedById)}
              </p>
              {invitation ? (
                <>
                  <div className="my-2.5 h-px bg-slate-200" />
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <UsersRound className="size-3.5 text-slate-400" />
                      {invitation.attendeeCount} người
                    </span>
                    {invitation.moneyGiftAmount ? (
                      <span className="flex items-center gap-1.5">
                        <Wallet className="size-3.5 text-slate-400" />
                        {formatCurrency(invitation.moneyGiftAmount)}
                      </span>
                    ) : null}
                    {invitation.goldGiftAmount ? (
                      <span className="flex items-center gap-1.5">
                        <Coins className="size-3.5 text-slate-400" />
                        {formatGoldGift(invitation.goldGiftAmount)}
                      </span>
                    ) : null}
                  </div>
                </>
              ) : null}
            </button>
            {onDeleteGuest ? (
              <button
                aria-label={`Xóa khách ${guest.name}`}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-rose-600 hover:bg-rose-50"
                onClick={() => onDeleteGuest(guest)}
                type="button"
              >
                <Trash2 className="size-4" />
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
