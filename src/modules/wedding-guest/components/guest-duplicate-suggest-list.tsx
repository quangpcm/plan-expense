'use client';

import {
  getWeddingGuestInvitedByLabel,
  getWeddingGuestRelationshipLabel,
  getWeddingGuestSideLabel,
} from '@/modules/wedding-guest/constants/wedding-guest-presets';
import type { DuplicateGuestLevel } from '@/modules/wedding-guest/utils/guest-duplicate';
import type { WeddingGuestDocument } from '@/modules/wedding-guest/types/wedding-guest';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';

export type GuestSuggestItem = {
  guest: WeddingGuestDocument;
  level?: DuplicateGuestLevel;
};

type GuestDuplicateSuggestListProps = {
  title?: string;
  items: GuestSuggestItem[];
  selectLabel?: string;
  onSelectGuest?: (guest: WeddingGuestDocument) => void;
};

export function GuestDuplicateSuggestList({
  title = 'Khách đã có',
  items,
  selectLabel = 'Chọn',
  onSelectGuest,
}: GuestDuplicateSuggestListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-2xl bg-amber-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
        {title}
      </p>
      <ul className="space-y-2">
        {items.map(({ guest, level }) => (
          <li
            className="flex items-center justify-between gap-3 rounded-xl bg-white p-3"
            key={guest.id}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-slate-950">
                  {guest.name}
                </p>
                {level === 'high' ? (
                  <Badge variant="danger">Khả năng trùng cao</Badge>
                ) : null}
                {level === 'name_only' ? (
                  <Badge variant="warning">Có khách cùng tên</Badge>
                ) : null}
              </div>
              <p className="truncate text-xs text-slate-500">
                {getWeddingGuestSideLabel(guest.sideId)} ·{' '}
                {getWeddingGuestRelationshipLabel(guest.relationshipId)} ·{' '}
                {getWeddingGuestInvitedByLabel(guest.invitedById)}
              </p>
            </div>
            {onSelectGuest ? (
              <Button
                className="shrink-0 px-3"
                onClick={() => onSelectGuest(guest)}
                variant="secondary"
              >
                {selectLabel}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
