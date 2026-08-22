'use client';

import { useMemo, useState } from 'react';
import { Hourglass, MapPinned, Sparkles, Users } from 'lucide-react';

import { toMapHref } from '@/modules/travel-activity/utils/travel-activity-display';
import type { TravelActivityDocument } from '@/modules/travel-activity/types/travel-activity';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { cn } from '@/shared/utils/cn';
import { formatTime } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

const TIME_COLUMN_WIDTH_CLASS = 'w-16';
const RAIL_COLUMN_WIDTH_CLASS = 'w-8';
const RAIL_X_CLASS = 'left-[78px]';
const CONNECTOR_WIDTH_CLASS = 'w-4';
const DAY_NODE_SIZE_CLASS = 'size-4';
const ACTIVITY_NODE_SIZE_CLASS = 'size-2';

type TravelActivityListProps = {
  activities: TravelActivityDocument[];
  selectedActivityId: string | null;
  onSelect: (activity: TravelActivityDocument) => void;
};

type ActivityDayGroup = {
  dayKey: string;
  shortLabel: string;
  title: string;
  subtitle: string;
  activities: TravelActivityDocument[];
};

type ActivityDisplayState = 'past' | 'current' | 'next' | 'future';

type ActivityInsight = {
  activity: TravelActivityDocument;
  kind: 'current' | 'next';
  detail: string;
};

export function TravelActivityList({
  activities,
  selectedActivityId,
  onSelect,
}: TravelActivityListProps) {
  const sortedActivities = useMemo(
    () =>
      [...activities].sort(
        (left, right) => left.startsAt.toMillis() - right.startsAt.toMillis(),
      ),
    [activities],
  );
  const groupedActivities = useMemo<ActivityDayGroup[]>(() => {
    const grouped = new Map<string, TravelActivityDocument[]>();

    sortedActivities.forEach((activity) => {
      const startsAt = timestampToDate(activity.startsAt) ?? new Date();
      const dayKey = toDayKey(startsAt);
      const dayActivities = grouped.get(dayKey);

      if (dayActivities) {
        dayActivities.push(activity);
      } else {
        grouped.set(dayKey, [activity]);
      }
    });

    return Array.from(grouped.entries()).map(([dayKey, dayActivities], index) => {
      const dayDate = timestampToDate(dayActivities[0]?.startsAt) ?? new Date();

      return {
        dayKey,
        shortLabel: formatShortDate(dayDate),
        title: `Ngày ${index + 1} · ${formatWeekdayDate(dayDate)}`,
        subtitle: getDaySubtitle(dayActivities),
        activities: dayActivities,
      };
    });
  }, [sortedActivities]);
  const insight = useMemo(
    () => buildActivityInsight(sortedActivities),
    [sortedActivities],
  );
  const nextActivityId = insight?.kind === 'next' ? insight.activity.id : null;
  const currentActivityId = insight?.kind === 'current' ? insight.activity.id : null;
  const [activeDayKey, setActiveDayKey] = useState<string>('all');

  const visibleDayGroups = useMemo(
    () =>
      activeDayKey === 'all'
        ? groupedActivities
        : groupedActivities.filter((group) => group.dayKey === activeDayKey),
    [activeDayKey, groupedActivities],
  );

  if (activities.length === 0) {
    return (
      <Card className="border-slate-200 bg-slate-50 shadow-none">
        <p className="text-sm leading-6 text-slate-600">
          Chưa có hoạt động nào trong itinerary. Khi thêm hoạt động, lịch trình sẽ tự nhóm theo từng ngày để dễ theo dõi.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Button
          className={cn(
            'min-h-10 px-4 text-sm shadow-none',
            activeDayKey === 'all'
              ? ''
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
          )}
          onClick={() => setActiveDayKey('all')}
          variant={activeDayKey === 'all' ? 'primary' : 'secondary'}
        >
          Tất cả
        </Button>
        {groupedActivities.map((group) => (
          <Button
            className={cn(
              'min-h-10 px-4 text-sm shadow-none',
              activeDayKey === group.dayKey
                ? ''
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
            )}
            key={group.dayKey}
            onClick={() => setActiveDayKey(group.dayKey)}
            variant={activeDayKey === group.dayKey ? 'primary' : 'secondary'}
          >
            {group.shortLabel}
          </Button>
        ))}
      </div>

      {insight ? (
        <Card className="gap-3 border-[var(--color-primary)]/18 bg-[color:color-mix(in_srgb,var(--color-primary)_5%,white)] p-4 shadow-none">
          <div className="flex items-center gap-2 text-[var(--color-primary)]">
            <Sparkles className="size-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.16em]">
              {insight.kind === 'current' ? 'Đang diễn ra' : 'Tiếp theo'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-950">
              {insight.activity.title}
            </p>
            <p className="text-sm text-slate-600">{insight.detail}</p>
            {insight.activity.locationName ? (
              <p className="text-sm text-slate-500">{insight.activity.locationName}</p>
            ) : null}
          </div>
        </Card>
      ) : null}

      <div className="space-y-8">
        {visibleDayGroups.map((group) => (
          <section className="relative" key={group.dayKey}>
            <span
              className={cn(
                'absolute top-14 bottom-4 w-px bg-[var(--color-border-strong)]/60',
                RAIL_X_CLASS,
              )}
            />

            <div className="relative grid grid-cols-[64px_32px_minmax(0,1fr)] items-start gap-x-0 pb-4">
              <div />
              <div className="relative flex min-h-8 items-center justify-center">
                <span
                  className={cn(
                    DAY_NODE_SIZE_CLASS,
                    'rounded-full bg-[var(--color-primary)] ring-4 ring-[color:color-mix(in_srgb,var(--color-primary)_15%,white)]',
                  )}
                />
              </div>
              <div className="space-y-1 pl-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
                  {group.title}
                </p>
                <p className="text-sm text-slate-500">{group.subtitle}</p>
              </div>
            </div>

            <div className="space-y-3">
              {group.activities.map((activity) => (
                <TravelActivityTimelineCard
                  activity={activity}
                  displayState={getActivityDisplayState(
                    activity,
                    currentActivityId,
                    nextActivityId,
                  )}
                  isSelected={selectedActivityId === activity.id}
                  key={activity.id}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

type TravelActivityTimelineCardProps = {
  activity: TravelActivityDocument;
  displayState: ActivityDisplayState;
  isSelected: boolean;
  onSelect: (activity: TravelActivityDocument) => void;
};

function TravelActivityTimelineCard({
  activity,
  displayState,
  isSelected,
  onSelect,
}: TravelActivityTimelineCardProps) {
  const startsAt = timestampToDate(activity.startsAt);
  const endsAt = timestampToDate(activity.endsAt);
  const durationLabel = getDurationLabel(startsAt, endsAt);
  const participantCount = activity.participantMemberIds.length;
  const isCurrent = displayState === 'current';
  const isNext = displayState === 'next';
  const isPast = displayState === 'past';
  const isTemporalAccent = isCurrent || isNext;

  return (
    <div className="grid grid-cols-[64px_32px_minmax(0,1fr)] items-start gap-x-0">
      <div
        className={cn(
          TIME_COLUMN_WIDTH_CLASS,
          'pt-3 text-right',
          isPast ? 'opacity-70' : '',
        )}
      >
        <p className="text-sm font-semibold tabular-nums text-slate-800">
          {startsAt ? formatTime(startsAt) : '--:--'}
        </p>
      </div>

      <div className={cn(RAIL_COLUMN_WIDTH_CLASS, 'relative flex min-h-[52px] items-start justify-center pt-[18px]')}>
        <span
          className={cn(
            'absolute top-[22px] left-1/2 h-px -translate-x-1/2',
            CONNECTOR_WIDTH_CLASS,
            isSelected || isTemporalAccent
              ? 'bg-[var(--color-primary)]/45'
              : 'bg-[var(--color-border-strong)]/45',
          )}
        />
        <span
          className={cn(
            ACTIVITY_NODE_SIZE_CLASS,
            'relative z-10 rounded-full border transition',
            isSelected ? 'ring-4 ring-[color:color-mix(in_srgb,var(--color-primary)_15%,white)]' : '',
            isCurrent
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
              : isNext
                ? 'border-[var(--color-primary)] bg-white'
                : 'border-slate-300 bg-white',
            isPast ? 'opacity-75' : '',
          )}
        />
      </div>

      <Card
        className={cn(
          'min-w-0 cursor-pointer gap-3 p-4 pl-4 transition',
          isPast
            ? 'border-slate-200 bg-white/90 text-slate-500'
            : 'bg-white',
          isSelected
            ? 'border-[var(--color-primary)] shadow-[0_22px_64px_rgba(36,59,107,0.12)]'
            : 'hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(23,32,51,0.08)]',
        )}
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
        <div className="space-y-1.5">
          {isCurrent || isNext ? (
            <span
              className={cn(
                'inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]',
                isCurrent
                  ? 'bg-[color:color-mix(in_srgb,var(--color-primary)_12%,white)] text-[var(--color-primary)]'
                  : 'bg-slate-100 text-slate-700',
              )}
            >
              {isCurrent ? 'Đang diễn ra' : 'Tiếp theo'}
            </span>
          ) : null}
          <p
            className={cn(
              'line-clamp-2 text-base font-semibold',
              isPast ? 'text-slate-700' : 'text-slate-950',
            )}
          >
            {activity.title}
          </p>
          <div
            className={cn(
              'flex flex-wrap gap-x-4 gap-y-2 text-sm',
              isPast ? 'text-slate-400' : 'text-slate-500',
            )}
          >
            {activity.locationName ? (
              <p className="flex min-w-0 items-center gap-1.5">
                <MapPinned className="size-3.5 shrink-0" />
                {activity.locationMapUrl ? (
                  <a
                    className={cn(
                      'truncate underline-offset-2 hover:underline',
                      isPast
                        ? 'text-slate-500'
                        : 'font-medium text-[var(--color-primary)]',
                    )}
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
            {durationLabel ? (
              <p className="flex items-center gap-1.5">
                <Hourglass className="size-3.5 shrink-0" />
                <span>{durationLabel}</span>
              </p>
            ) : null}
            {participantCount > 0 ? (
              <p className="flex items-center gap-1.5">
                <Users className="size-3.5 shrink-0" />
                <span>{participantCount} người tham gia</span>
              </p>
            ) : null}
          </div>
        </div>
        {activity.note ? (
          <p
            className={cn(
              'line-clamp-2 text-sm leading-6',
              isPast ? 'text-slate-500' : 'text-slate-600',
            )}
          >
            {activity.note}
          </p>
        ) : null}
      </Card>
    </div>
  );
}

function getActivityDisplayState(
  activity: TravelActivityDocument,
  currentActivityId: string | null,
  nextActivityId: string | null,
): ActivityDisplayState {
  if (activity.id === currentActivityId) {
    return 'current';
  }

  if (activity.id === nextActivityId) {
    return 'next';
  }

  return activity.startsAt.toMillis() < Date.now() ? 'past' : 'future';
}

function buildActivityInsight(
  activities: TravelActivityDocument[],
): ActivityInsight | null {
  const now = Date.now();

  const currentActivity = activities.find((activity) => {
    const startsAt = activity.startsAt.toMillis();
    const endsAt = activity.endsAt?.toMillis() ?? null;

    if (startsAt > now) {
      return false;
    }

    if (endsAt == null) {
      return false;
    }

    return now < endsAt;
  });

  if (currentActivity) {
    const endsAt = timestampToDate(currentActivity.endsAt);

    return {
      activity: currentActivity,
      kind: 'current',
      detail: endsAt
        ? `Còn khoảng ${formatRemainingTime(endsAt.getTime() - now)}`
        : 'Đang diễn ra',
    };
  }

  const nextActivity = activities.find((activity) => activity.startsAt.toMillis() > now);

  if (!nextActivity) {
    return null;
  }

  return {
    activity: nextActivity,
    kind: 'next',
    detail: buildNextInsightDetail(nextActivity, now),
  };
}

function buildNextInsightDetail(
  activity: TravelActivityDocument,
  now: number,
) {
  const startsAt = timestampToDate(activity.startsAt);

  if (!startsAt) {
    return 'Đã lên lịch';
  }

  const diffMs = startsAt.getTime() - now;

  if (diffMs < 7 * 24 * 60 * 60 * 1000) {
    return `${formatTime(startsAt)} · ${formatRemainingTime(diffMs)}`;
  }

  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(startsAt)
    .replace(',', ' ·');
}

function formatRemainingTime(diffMs: number) {
  const totalMinutes = Math.max(1, Math.floor(diffMs / (60 * 1000)));

  if (totalMinutes < 60) {
    return `còn ${totalMinutes} phút`;
  }

  if (totalMinutes < 24 * 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (minutes === 0) {
      return `còn ${hours} giờ`;
    }

    return `còn ${hours} giờ ${minutes} phút`;
  }

  const totalDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return `còn ${totalDays} ngày`;
}

function toDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

function formatWeekdayDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  })
    .format(date)
    .replace(',', '')
    .replace(/^./, (char) => char.toUpperCase());
}

function getDaySubtitle(activities: TravelActivityDocument[]) {
  const firstStartsAt = timestampToDate(activities[0]?.startsAt ?? null);
  const activityLabel = `${activities.length} hoạt động`;

  if (!firstStartsAt) {
    return activityLabel;
  }

  return `${activityLabel} · Bắt đầu ${formatTime(firstStartsAt)}`;
}

function getDurationLabel(startsAt: Date | null, endsAt: Date | null) {
  if (!startsAt || !endsAt) {
    return null;
  }

  const diffMs = endsAt.getTime() - startsAt.getTime();

  if (diffMs <= 0) {
    return null;
  }

  const totalMinutes = Math.round(diffMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours} giờ ${minutes} phút`;
  }

  if (hours > 0) {
    return `${hours} giờ`;
  }

  return `${minutes} phút`;
}
