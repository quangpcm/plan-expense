'use client';

import { useState } from 'react';

import { WeddingGuestCompositionRows } from '@/modules/wedding-guest/components/wedding-guest-composition-rows';
import { getWeddingGuestAttributeLabel } from '@/modules/wedding-guest/constants/wedding-guest-presets';
import type { GuestInvitationDocument } from '@/modules/wedding-guest/types/guest-invitation';
import type { WeddingGuestDocument } from '@/modules/wedding-guest/types/wedding-guest';
import {
  calculateGuestStatisticByAttribute,
  type GuestAttributeKey,
} from '@/modules/wedding-guest/utils/wedding-guest-statistic';
import { cn } from '@/shared/utils/cn';

type WeddingGuestListCompositionProps = {
  guests: WeddingGuestDocument[];
  invitations: GuestInvitationDocument[];
};

const TABS: Array<{ key: GuestAttributeKey; label: string }> = [
  { key: 'sideId', label: 'Theo phía' },
  { key: 'relationshipId', label: 'Theo quan hệ' },
  { key: 'invitedById', label: 'Theo khách của' },
];

export function WeddingGuestListComposition({
  guests,
  invitations,
}: WeddingGuestListCompositionProps) {
  const [activeTab, setActiveTab] = useState<GuestAttributeKey>('sideId');
  const rows = calculateGuestStatisticByAttribute(
    guests,
    invitations,
    activeTab,
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1 self-start">
        {TABS.map((tab) => (
          <button
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition',
              activeTab === tab.key
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500',
            )}
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <WeddingGuestCompositionRows
        getLabel={(attributeId) =>
          getWeddingGuestAttributeLabel(activeTab, attributeId)
        }
        metric="guestCount"
        rows={rows}
      />
    </div>
  );
}
