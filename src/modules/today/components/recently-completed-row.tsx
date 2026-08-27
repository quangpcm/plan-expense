'use client';

import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';

import type { RecentlyCompletedItem } from '@/modules/today/types/today-summary';
import { DataRow } from '@/shared/components/ui/data-row';
import { formatRelativeTime } from '@/shared/utils/date';

type RecentlyCompletedRowProps = {
  item: RecentlyCompletedItem;
};

// COMPOSE — DataRow's leading/main/status anatomy fits this exactly (single interaction zone, the
// whole row navigates), same as TodayItemCard. Deliberately borderless/no Card chrome (unlike
// TodayItemCard) — "compact list", not a card per item, per this feature's explicit ask.
// formatRelativeTime already produces "35 phút trước" via Intl.RelativeTimeFormat(vi-VN) — reused
// as-is (already used for the same "time since" concept in plan-card-config.ts), not a new
// formatter.
export function RecentlyCompletedRow({ item }: RecentlyCompletedRowProps) {
  const router = useRouter();

  return (
    <DataRow
      className="w-full rounded-[var(--radius-ds-md)]"
      density="compact"
      leading={
        <div className="flex size-8 items-center justify-center rounded-full bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)]">
          <Check aria-hidden="true" className="size-4" />
        </div>
      }
      main={
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-body-strong text-[var(--color-text-primary)]">{item.title}</p>
          <p className="truncate text-metadata text-[var(--color-text-secondary)]">{item.planName}</p>
        </div>
      }
      onClick={() => router.push(`/plans/${item.planId}?tab=todos&todoId=${item.todoId}`)}
      status={
        <span className="text-metadata text-[var(--color-text-secondary)]">
          {formatRelativeTime(item.completedAt.toDate())}
        </span>
      }
    />
  );
}
