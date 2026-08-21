'use client';

import { useState } from 'react';

import {
  WEDDING_GUEST_INVITED_BY,
  WEDDING_GUEST_RELATIONSHIPS,
  WEDDING_GUEST_SIDES,
} from '@/modules/wedding-guest/constants/wedding-guest-presets';
import type { GuestInvitationDocument } from '@/modules/wedding-guest/types/guest-invitation';
import type { WeddingGuestDocument } from '@/modules/wedding-guest/types/wedding-guest';
import type { WeddingGuestGroupDocument } from '@/modules/wedding-guest/types/wedding-guest-group';
import { formatGoldGift } from '@/modules/wedding-guest/utils/gold-gift';
import {
  calculateGuestStatisticByAttribute,
  calculateGuestStatisticByGroup,
} from '@/modules/wedding-guest/utils/wedding-guest-statistic';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { formatCompactCurrency } from '@/shared/utils/currency';
import { cn } from '@/shared/utils/cn';

type WeddingGuestStatsProps = {
  guests: WeddingGuestDocument[];
  groups: WeddingGuestGroupDocument[];
  invitations: GuestInvitationDocument[];
};

// Each row's dot/bar shares one categorical hue, assigned in fixed order — but
// the name/label is always rendered alongside it, so color never carries
// identity on its own. Categories beyond the fixed set fall back to neutral
// gray instead of wrapping back to an earlier hue.
const CATEGORY_COLORS = [
  { dot: 'bg-amber-500', bar: 'bg-amber-500' },
  { dot: 'bg-indigo-500', bar: 'bg-indigo-500' },
  { dot: 'bg-slate-500', bar: 'bg-slate-500' },
  { dot: 'bg-emerald-600', bar: 'bg-emerald-600' },
  { dot: 'bg-rose-500', bar: 'bg-rose-500' },
  { dot: 'bg-sky-600', bar: 'bg-sky-600' },
];
const FALLBACK_COLOR = { dot: 'bg-slate-400', bar: 'bg-slate-400' };

function getCategoryColor(index: number) {
  return CATEGORY_COLORS[index] ?? FALLBACK_COLOR;
}

function ShareBar({
  percent,
  className,
}: {
  percent: number;
  className: string;
}) {
  const safePercent = Number.isFinite(percent)
    ? Math.min(100, Math.max(0, percent))
    : 0;

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={cn('h-full rounded-full', className)}
        style={{ width: `${safePercent}%` }}
      />
    </div>
  );
}

function TopBadge() {
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
      Top
    </span>
  );
}

export function WeddingGuestStats({
  guests,
  groups,
  invitations,
}: WeddingGuestStatsProps) {
  const [sideMetric, setSideMetric] = useState<'guestCount' | 'moneyGiftTotal'>(
    'guestCount',
  );

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
  const byInvitedBy = calculateGuestStatisticByAttribute(
    guests,
    invitations,
    'invitedById',
  );

  const totalGroupGuestCount = byGroup.reduce(
    (sum, row) => sum + row.guestCount,
    0,
  );
  const totalSideGuestCount = bySide.reduce(
    (sum, row) => sum + row.guestCount,
    0,
  );
  const totalSideMoney = bySide.reduce(
    (sum, row) => sum + row.moneyGiftTotal,
    0,
  );
  const totalSideBasis =
    sideMetric === 'guestCount' ? totalSideGuestCount : totalSideMoney;
  const totalRelationshipGuestCount = byRelationship.reduce(
    (sum, row) => sum + row.guestCount,
    0,
  );
  const totalInvitedByGuestCount = byInvitedBy.reduce(
    (sum, row) => sum + row.guestCount,
    0,
  );

  const topGroupByGuests = byGroup.length
    ? byGroup.reduce((top, row) =>
        row.guestCount > top.guestCount ? row : top,
      )
    : null;
  const topGroupId = topGroupByGuests?.group.id ?? null;

  const topRelationship = byRelationship.length
    ? byRelationship.reduce((top, row) =>
        row.guestCount > top.guestCount ? row : top,
      )
    : null;
  const topRelationshipId = topRelationship?.attributeId ?? null;

  const topInvitedBy = byInvitedBy.length
    ? byInvitedBy.reduce((top, row) =>
        row.guestCount > top.guestCount ? row : top,
      )
    : null;
  const topInvitedById = topInvitedBy?.attributeId ?? null;

  return (
    <div className="space-y-5">
      <Card>
        <SectionHeading eyebrow="Thống kê chi tiết" title="Theo nhóm/tiệc" />

          {byGroup.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có nhóm nào.</p>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="py-2 pr-3 font-medium">Nhóm</th>
                      <th className="py-2 pr-3 text-right font-medium">
                        Số khách
                      </th>
                      <th className="py-2 pr-3 text-right font-medium">
                        Tiền mừng
                      </th>
                      <th className="py-2 pr-3 text-right font-medium">
                        Vàng mừng
                      </th>
                      <th className="py-2 pr-3 text-right font-medium">
                        TB/khách
                      </th>
                      <th className="py-2 pl-3 font-medium">Tỷ trọng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byGroup.map((row, index) => {
                      const color = getCategoryColor(index);
                      const share =
                        totalGroupGuestCount > 0
                          ? (row.guestCount / totalGroupGuestCount) * 100
                          : 0;
                      const average =
                        row.guestCount > 0
                          ? row.moneyGiftTotal / row.guestCount
                          : 0;

                      return (
                        <tr
                          className="border-b border-slate-50 last:border-0"
                          key={row.group.id}
                        >
                          <td className="py-3 pr-3">
                            <span className="flex items-center gap-2 font-medium text-slate-900">
                              <span
                                className={cn(
                                  'size-2 shrink-0 rounded-full',
                                  color.dot,
                                )}
                              />
                              {row.group.name}
                              {row.group.id === topGroupId ? (
                                <TopBadge />
                              ) : null}
                            </span>
                          </td>
                          <td className="py-3 pr-3 text-right text-slate-700">
                            {row.guestCount}
                          </td>
                          <td className="py-3 pr-3 text-right text-slate-700">
                            {formatCompactCurrency(row.moneyGiftTotal)}
                          </td>
                          <td className="py-3 pr-3 text-right text-slate-700">
                            {row.goldGiftTotal > 0
                              ? formatGoldGift(row.goldGiftTotal)
                              : '—'}
                          </td>
                          <td className="py-3 pr-3 text-right text-slate-700">
                            {formatCompactCurrency(average)}
                          </td>
                          <td className="py-3 pl-3">
                            <div className="flex items-center gap-2">
                              <ShareBar className={color.bar} percent={share} />
                              <span className="w-9 shrink-0 text-right text-xs text-slate-500">
                                {Math.round(share)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="space-y-3 lg:hidden">
                {byGroup.map((row, index) => {
                  const color = getCategoryColor(index);
                  const share =
                    totalGroupGuestCount > 0
                      ? (row.guestCount / totalGroupGuestCount) * 100
                      : 0;
                  const average =
                    row.guestCount > 0
                      ? row.moneyGiftTotal / row.guestCount
                      : 0;

                  return (
                    <li
                      className="space-y-2 rounded-2xl bg-slate-50 p-3"
                      key={row.group.id}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                          <span
                            className={cn(
                              'size-2 shrink-0 rounded-full',
                              color.dot,
                            )}
                          />
                          {row.group.name}
                          {row.group.id === topGroupId ? <TopBadge /> : null}
                        </span>
                        <span className="text-xs text-slate-500">
                          {Math.round(share)}%
                        </span>
                      </div>
                      <ShareBar className={color.bar} percent={share} />
                      <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-600">
                        <span>
                          Khách:{' '}
                          <strong className="text-slate-900">
                            {row.guestCount}
                          </strong>
                        </span>
                        <span>
                          TB/khách:{' '}
                          <strong className="text-slate-900">
                            {formatCompactCurrency(average)}
                          </strong>
                        </span>
                        <span>
                          Tiền mừng:{' '}
                          <strong className="text-slate-900">
                            {formatCompactCurrency(row.moneyGiftTotal)}
                          </strong>
                        </span>
                        <span>
                          Vàng:{' '}
                          <strong className="text-slate-900">
                            {row.goldGiftTotal > 0
                              ? formatGoldGift(row.goldGiftTotal)
                              : '—'}
                          </strong>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeading eyebrow="Thống kê chi tiết" title="Theo phía" />
            <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
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
          </div>

          <div className="space-y-4">
            {bySide.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
            ) : (
              bySide.map((row, index) => {
                const color = getCategoryColor(index);
                const value = row[sideMetric];
                const percent =
                  totalSideBasis > 0 ? (value / totalSideBasis) * 100 : 0;

                return (
                  <div className="space-y-1.5" key={row.attributeId}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-900">
                        {WEDDING_GUEST_SIDES.find(
                          (side) => side.id === row.attributeId,
                        )?.label ?? row.attributeId}
                      </span>
                      <span className="font-semibold text-slate-950">
                        {Math.round(percent)}%
                      </span>
                    </div>
                    <ShareBar className={color.bar} percent={percent} />
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card>
          <SectionHeading eyebrow="Thống kê chi tiết" title="Theo quan hệ" />
          {byRelationship.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
          ) : (
            <ul className="space-y-1">
              {byRelationship.map((row, index) => {
                const color = getCategoryColor(index);
                const percent =
                  totalRelationshipGuestCount > 0
                    ? (row.guestCount / totalRelationshipGuestCount) * 100
                    : 0;
                const isTop = row.attributeId === topRelationshipId;

                return (
                  <li
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5',
                      isTop ? 'bg-slate-50' : '',
                    )}
                    key={row.attributeId}
                  >
                    <span className="flex items-center gap-2 text-sm text-slate-700">
                      <span
                        className={cn(
                          'size-2.5 shrink-0 rounded-full',
                          color.dot,
                        )}
                      />
                      {WEDDING_GUEST_RELATIONSHIPS.find(
                        (relationship) => relationship.id === row.attributeId,
                      )?.label ?? row.attributeId}
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-semibold text-slate-950">
                        {Math.round(percent)}%
                      </span>
                      <span className="block text-xs text-slate-500">
                        {row.guestCount} khách
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <SectionHeading eyebrow="Thống kê chi tiết" title="Theo khách của" />
          {byInvitedBy.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
          ) : (
            <ul className="space-y-1">
              {byInvitedBy.map((row, index) => {
                const color = getCategoryColor(index);
                const percent =
                  totalInvitedByGuestCount > 0
                    ? (row.guestCount / totalInvitedByGuestCount) * 100
                    : 0;
                const isTop = row.attributeId === topInvitedById;

                return (
                  <li
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5',
                      isTop ? 'bg-slate-50' : '',
                    )}
                    key={row.attributeId}
                  >
                    <span className="flex items-center gap-2 text-sm text-slate-700">
                      <span
                        className={cn(
                          'size-2.5 shrink-0 rounded-full',
                          color.dot,
                        )}
                      />
                      {WEDDING_GUEST_INVITED_BY.find(
                        (invitedBy) => invitedBy.id === row.attributeId,
                      )?.label ?? row.attributeId}
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-semibold text-slate-950">
                        {Math.round(percent)}%
                      </span>
                      <span className="block text-xs text-slate-500">
                        {row.guestCount} khách
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
