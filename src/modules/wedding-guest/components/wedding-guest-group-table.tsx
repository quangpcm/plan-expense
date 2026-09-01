'use client';

import { useState } from 'react';

import type { GuestInvitationDocument } from '@/modules/wedding-guest/types/guest-invitation';
import type { WeddingGuestGroupDocument } from '@/modules/wedding-guest/types/wedding-guest-group';
import { formatGoldGift } from '@/modules/wedding-guest/utils/gold-gift';
import { calculateGuestStatisticByGroup } from '@/modules/wedding-guest/utils/wedding-guest-statistic';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { formatCompactCurrency } from '@/shared/utils/currency';
import { cn } from '@/shared/utils/cn';

type WeddingGuestGroupTableProps = {
  groups: WeddingGuestGroupDocument[];
  invitations: GuestInvitationDocument[];
  activeGroupId: string | null;
};

type MetricMode = 'attendance' | 'gift';

const ROW_HIGHLIGHT_CLASS =
  'bg-[var(--color-brand-selected)] ring-1 ring-inset ring-[var(--color-brand-primary)]';

export function WeddingGuestGroupTable({
  groups,
  invitations,
  activeGroupId,
}: WeddingGuestGroupTableProps) {
  const [metricMode, setMetricMode] = useState<MetricMode>('attendance');

  const byGroup = calculateGuestStatisticByGroup(groups, invitations);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeading eyebrow="Tổng hợp khách mời" title="Theo nhóm/tiệc" />
        <div className="flex items-center gap-1 rounded-full bg-[var(--color-surface-subtle)] p-1">
          <button
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition',
              metricMode === 'attendance'
                ? 'bg-[var(--color-surface-default)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-muted)]',
            )}
            onClick={() => setMetricMode('attendance')}
            type="button"
          >
            Tham dự
          </button>
          <button
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition',
              metricMode === 'gift'
                ? 'bg-[var(--color-surface-default)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-muted)]',
            )}
            onClick={() => setMetricMode('gift')}
            type="button"
          >
            Mừng cưới
          </button>
        </div>
      </div>

      {byGroup.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">Chưa có nhóm nào.</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)] text-left text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                  <th className="py-2 pr-3 font-medium">Nhóm</th>
                  <th className="py-2 pr-3 text-right font-medium">
                    Khách mời
                  </th>
                  <th className="py-2 pr-3 text-right font-medium">
                    Người dự kiến
                  </th>
                  {metricMode === 'attendance' ? (
                    <>
                      <th className="py-2 pr-3 text-right font-medium">
                        Đã xác nhận
                      </th>
                      <th className="py-2 pl-3 text-right font-medium">
                        Chờ phản hồi
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="py-2 pr-3 text-right font-medium">
                        Tiền mừng
                      </th>
                      <th className="py-2 pr-3 text-right font-medium">
                        Vàng mừng
                      </th>
                      <th className="py-2 pl-3 text-right font-medium">
                        TB/khách
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {byGroup.map((row) => {
                  const average =
                    row.guestCount > 0
                      ? row.moneyGiftTotal / row.guestCount
                      : 0;
                  const isActive = row.group.id === activeGroupId;

                  return (
                    <tr
                      className={cn(
                        'border-b border-[var(--color-border-subtle)] last:border-0',
                        isActive && ROW_HIGHLIGHT_CLASS,
                      )}
                      key={row.group.id}
                    >
                      <td className="py-3 pr-3 font-medium text-[var(--color-text-primary)]">
                        {row.group.name}
                      </td>
                      <td className="py-3 pr-3 text-right text-[var(--color-text-secondary)]">
                        {row.guestCount}
                      </td>
                      <td className="py-3 pr-3 text-right text-[var(--color-text-secondary)]">
                        {row.attendeeCount}
                      </td>
                      {metricMode === 'attendance' ? (
                        <>
                          <td className="py-3 pr-3 text-right text-[var(--color-text-secondary)]">
                            {row.rsvpBreakdown.attending}
                          </td>
                          <td className="py-3 pl-3 text-right text-[var(--color-text-secondary)]">
                            {row.rsvpBreakdown.pending}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 pr-3 text-right text-[var(--color-text-secondary)]">
                            {formatCompactCurrency(row.moneyGiftTotal)}
                          </td>
                          <td className="py-3 pr-3 text-right text-[var(--color-text-secondary)]">
                            {row.goldGiftTotal > 0
                              ? formatGoldGift(row.goldGiftTotal)
                              : '—'}
                          </td>
                          <td className="py-3 pl-3 text-right text-[var(--color-text-secondary)]">
                            {formatCompactCurrency(average)}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 lg:hidden">
            {byGroup.map((row) => {
              const average =
                row.guestCount > 0 ? row.moneyGiftTotal / row.guestCount : 0;
              const isActive = row.group.id === activeGroupId;

              return (
                <li
                  className={cn(
                    'space-y-2 rounded-2xl bg-[var(--color-surface-subtle)] p-3',
                    isActive && ROW_HIGHLIGHT_CLASS,
                  )}
                  key={row.group.id}
                >
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {row.group.name}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-xs text-[var(--color-text-secondary)]">
                    <span>
                      Khách mời:{' '}
                      <strong className="text-[var(--color-text-primary)]">
                        {row.guestCount}
                      </strong>
                    </span>
                    <span>
                      Người dự kiến:{' '}
                      <strong className="text-[var(--color-text-primary)]">
                        {row.attendeeCount}
                      </strong>
                    </span>
                    {metricMode === 'attendance' ? (
                      <>
                        <span>
                          Đã xác nhận:{' '}
                          <strong className="text-[var(--color-text-primary)]">
                            {row.rsvpBreakdown.attending}
                          </strong>
                        </span>
                        <span>
                          Chờ phản hồi:{' '}
                          <strong className="text-[var(--color-text-primary)]">
                            {row.rsvpBreakdown.pending}
                          </strong>
                        </span>
                      </>
                    ) : (
                      <>
                        <span>
                          Tiền mừng:{' '}
                          <strong className="text-[var(--color-text-primary)]">
                            {formatCompactCurrency(row.moneyGiftTotal)}
                          </strong>
                        </span>
                        <span>
                          Vàng:{' '}
                          <strong className="text-[var(--color-text-primary)]">
                            {row.goldGiftTotal > 0
                              ? formatGoldGift(row.goldGiftTotal)
                              : '—'}
                          </strong>
                        </span>
                        <span>
                          TB/khách:{' '}
                          <strong className="text-[var(--color-text-primary)]">
                            {formatCompactCurrency(average)}
                          </strong>
                        </span>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Card>
  );
}
