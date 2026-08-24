'use client';

import { useState } from 'react';

import { getWeddingGuestAttributeLabel } from '@/modules/wedding-guest/constants/wedding-guest-presets';
import { WeddingGuestCompositionRows } from '@/modules/wedding-guest/components/wedding-guest-composition-rows';
import type { GuestInvitationDocument } from '@/modules/wedding-guest/types/guest-invitation';
import type { WeddingGuestDocument } from '@/modules/wedding-guest/types/wedding-guest';
import {
  calculateGuestStatisticByAttribute,
  type GuestAttributeKey,
} from '@/modules/wedding-guest/utils/wedding-guest-statistic';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { cn } from '@/shared/utils/cn';

type WeddingGuestCompositionCardProps = {
  guests: WeddingGuestDocument[];
  invitations: GuestInvitationDocument[];
  onSelectAttribute: (
    attributeKey: GuestAttributeKey,
    attributeId: string,
  ) => void;
};

const TABS: Array<{ key: GuestAttributeKey; label: string }> = [
  { key: 'sideId', label: 'Theo phía' },
  { key: 'relationshipId', label: 'Theo quan hệ' },
  { key: 'invitedById', label: 'Theo khách của' },
];

export function WeddingGuestCompositionCard({
  guests,
  invitations,
  onSelectAttribute,
}: WeddingGuestCompositionCardProps) {
  const [activeTab, setActiveTab] = useState<GuestAttributeKey>('sideId');
  const [sideMetric, setSideMetric] = useState<'guestCount' | 'moneyGiftTotal'>(
    'guestCount',
  );

  const rows = calculateGuestStatisticByAttribute(
    guests,
    invitations,
    activeTab,
  );
  const metric = activeTab === 'sideId' ? sideMetric : 'guestCount';

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeading eyebrow="Tổng hợp khách mời" title="Cơ cấu khách mời" />
        <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
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
      </div>

      {activeTab === 'sideId' ? (
        <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1 self-start">
          <button
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition',
              sideMetric === 'guestCount'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500',
            )}
            onClick={() => setSideMetric('guestCount')}
            type="button"
          >
            Khách
          </button>
          <button
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition',
              sideMetric === 'moneyGiftTotal'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500',
            )}
            onClick={() => setSideMetric('moneyGiftTotal')}
            type="button"
          >
            Tiền mừng
          </button>
        </div>
      ) : null}

      <WeddingGuestCompositionRows
        getLabel={(attributeId) =>
          getWeddingGuestAttributeLabel(activeTab, attributeId)
        }
        metric={metric}
        onSelect={(attributeId) => onSelectAttribute(activeTab, attributeId)}
        rows={rows}
      />
    </Card>
  );
}
