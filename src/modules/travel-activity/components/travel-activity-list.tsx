'use client';

import { useMemo } from 'react';
import { MapPinned, Moon, Sun, Sunrise, Sunset } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { toMapHref } from '@/modules/travel-activity/utils/travel-activity-display';
import type { TravelActivityDocument } from '@/modules/travel-activity/types/travel-activity';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { formatDate, formatTime, getDayPeriodLabel } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

// Rail width dùng chung cho dot ngày (header) và dot từng activity, cả 2 đều
// neo theo `justify-end` cùng size-2.5 nên tâm dot luôn thẳng cột — đường kẻ
// dọc `left-[31px]` (= 36px rail − 5px bán kính dot) không bị lệch giữa 2 cấp.
const TIMELINE_RAIL_WIDTH_CLASS = 'w-9';
const TIMELINE_RAIL_LINE_OFFSET_CLASS = 'left-[31px]';

const DAY_PERIOD_STYLE: Record<string, { icon: LucideIcon; className: string }> = {
  'Sáng': { icon: Sunrise, className: 'text-amber-500' },
  'Chiều': { icon: Sun, className: 'text-orange-500' },
  'Tối': { icon: Sunset, className: 'text-rose-500' },
  'Đêm': { icon: Moon, className: 'text-indigo-500' },
};

type TravelActivityListProps = {
  activities: TravelActivityDocument[];
  canManage: boolean;
  onCreate: () => void;
  onSelect: (activity: TravelActivityDocument) => void;
};

export function TravelActivityList({
  activities,
  canManage,
  onCreate,
  onSelect,
}: TravelActivityListProps) {
  const groupedActivities = useMemo(() => {
    const sorted = [...activities].sort(
      (a, b) => a.startsAt.toMillis() - b.startsAt.toMillis(),
    );

    const grouped = sorted.reduce<Map<string, TravelActivityDocument[]>>(
      (accumulator, activity) => {
        const dayKey = formatDate(timestampToDate(activity.startsAt) ?? new Date());
        const dayActivities = accumulator.get(dayKey);

        if (dayActivities) {
          dayActivities.push(activity);
        } else {
          accumulator.set(dayKey, [activity]);
        }

        return accumulator;
      },
      new Map<string, TravelActivityDocument[]>(),
    );

    return Array.from(grouped.entries());
  }, [activities]);

  if (activities.length === 0) {
    return (
      <Card className="border-slate-200 bg-slate-50 shadow-none">
        <p className="text-sm leading-6 text-slate-600">
          Chưa có hoạt động nào trong itinerary. {canManage ? 'Bạn có thể tạo hoạt động đầu tiên ngay bây giờ.' : ''}
        </p>
        {canManage ? (
          <div>
            <Button onClick={onCreate} variant="secondary">
              Tạo hoạt động
            </Button>
          </div>
        ) : null}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {canManage ? (
        <div className="flex justify-end">
          <Button onClick={onCreate}>Tạo hoạt động</Button>
        </div>
      ) : null}
      <div className="space-y-8">
        {groupedActivities.map(([day, dayActivities]) => (
          <div className="relative" key={day}>
            <span
              className={cn(
                'absolute top-3 bottom-3 w-px bg-[var(--color-border-strong)]',
                TIMELINE_RAIL_LINE_OFFSET_CLASS,
              )}
            />

            <div className="relative flex items-center gap-3 pb-4">
              <span className={cn('flex shrink-0 items-center justify-end', TIMELINE_RAIL_WIDTH_CLASS)}>
                <span className="size-2.5 rounded-full bg-[var(--color-primary)] ring-4 ring-[color:color-mix(in_srgb,var(--color-primary)_15%,white)]" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">{day}</p>
            </div>

            <div className="space-y-3">
              {dayActivities.map((activity) => (
                <TravelActivityTimelineCard
                  activity={activity}
                  key={activity.id}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type TravelActivityTimelineCardProps = {
  activity: TravelActivityDocument;
  onSelect: (activity: TravelActivityDocument) => void;
};

function TravelActivityTimelineCard({ activity, onSelect }: TravelActivityTimelineCardProps) {
  const startsAt = timestampToDate(activity.startsAt);
  const dayPeriod = startsAt ? getDayPeriodLabel(startsAt) : null;
  const dayPeriodStyle = dayPeriod ? DAY_PERIOD_STYLE[dayPeriod] : null;
  const DayPeriodIcon = dayPeriodStyle?.icon ?? null;

  return (
    <div className="relative flex items-start gap-3">
      <div className={cn('flex shrink-0 items-center justify-end gap-1.5 pt-4', TIMELINE_RAIL_WIDTH_CLASS)}>
        <div className="flex flex-col items-center gap-0.5">
          {DayPeriodIcon ? (
            <DayPeriodIcon aria-hidden="true" className={cn('size-3', dayPeriodStyle?.className)} />
          ) : null}
          <span className="text-[11px] font-semibold tabular-nums text-slate-600">
            {startsAt ? formatTime(startsAt) : '--:--'}
          </span>
          <span className="sr-only">{dayPeriod}</span>
        </div>
        <span className="size-2.5 shrink-0 rounded-full bg-[var(--color-primary)] ring-4 ring-[color:color-mix(in_srgb,var(--color-primary)_15%,white)]" />
      </div>

      <Card
        className="min-w-0 flex-1 cursor-pointer gap-2 p-4 transition hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(23,32,51,0.08)]"
        onClick={() => onSelect(activity)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(activity);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <p className="truncate text-base font-semibold text-slate-950">{activity.title}</p>
        {activity.locationName ? (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPinned className="size-3.5 shrink-0" />
            {activity.locationMapUrl ? (
              <a
                className="truncate font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                href={toMapHref(activity.locationMapUrl)}
                onClick={(event) => event.stopPropagation()}
                rel="noreferrer"
                target="_blank"
              >
                {activity.locationName}
              </a>
            ) : (
              <span className="truncate">{activity.locationName}</span>
            )}
          </p>
        ) : null}
      </Card>
    </div>
  );
}
