'use client';

import { useState } from 'react';

import {
  WEDDING_GUEST_INVITED_BY,
  WEDDING_GUEST_RELATIONSHIPS,
  WEDDING_GUEST_SIDES,
} from '@/modules/wedding-guest/constants/wedding-guest-presets';
import {
  getCategoryColor,
  ShareBar,
} from '@/modules/wedding-guest/components/wedding-guest-stat-visuals';
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

function getAttributeLabel(
  attributeKey: GuestAttributeKey,
  attributeId: string,
) {
  if (attributeKey === 'sideId') {
    return (
      WEDDING_GUEST_SIDES.find((side) => side.id === attributeId)?.label ??
      attributeId
    );
  }

  if (attributeKey === 'relationshipId') {
    return (
      WEDDING_GUEST_RELATIONSHIPS.find(
        (relationship) => relationship.id === attributeId,
      )?.label ?? attributeId
    );
  }

  return (
    WEDDING_GUEST_INVITED_BY.find((invitedBy) => invitedBy.id === attributeId)
      ?.label ?? attributeId
  );
}

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
  const totalBasis = rows.reduce((sum, row) => sum + row[metric], 0);

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

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
      ) : (
        <ul className="space-y-1">
          {rows.map((row, index) => {
            const color = getCategoryColor(index);
            const value = row[metric];
            const percent = totalBasis > 0 ? (value / totalBasis) * 100 : 0;
            const label = getAttributeLabel(activeTab, row.attributeId);

            return (
              <li key={row.attributeId}>
                <button
                  className="flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-slate-50"
                  onClick={() => onSelectAttribute(activeTab, row.attributeId)}
                  type="button"
                >
                  <span className="flex items-center gap-2 text-sm text-slate-700">
                    <span
                      className={cn(
                        'size-2.5 shrink-0 rounded-full',
                        color.dot,
                      )}
                    />
                    {label}
                  </span>
                  <span className="flex items-center gap-3 text-right">
                    <span className="hidden w-24 sm:block">
                      <ShareBar className={color.bar} percent={percent} />
                    </span>
                    <span className="block w-10 shrink-0 text-sm font-semibold text-slate-950">
                      {Math.round(percent)}%
                    </span>
                    <span className="block w-16 shrink-0 text-xs text-slate-500">
                      {row.guestCount} khách
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
