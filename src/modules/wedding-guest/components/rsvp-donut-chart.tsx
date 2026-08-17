'use client';

import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { GuestRsvpBreakdown } from '@/modules/wedding-guest/utils/wedding-guest-statistic';

type RsvpDonutChartProps = {
  breakdown: GuestRsvpBreakdown;
};

type Segment = {
  key: keyof GuestRsvpBreakdown;
  label: string;
  color: string;
  icon: LucideIcon;
};

// Part-to-whole across 3 fixed states, well under the 6-segment "at a glance"
// ceiling — but status color alone isn't a safe identity channel (warning vs
// danger measure ΔE ~14 for normal vision), so every segment ships with an
// icon + text label; color never carries meaning on its own.
const SEGMENTS: Segment[] = [
  {
    key: 'attending',
    label: 'Tham dự',
    color: 'var(--color-success)',
    icon: CheckCircle2,
  },
  {
    key: 'pending',
    label: 'Chưa xác nhận',
    color: 'var(--color-warning)',
    icon: Clock3,
  },
  {
    key: 'not_attending',
    label: 'Không tham dự',
    color: 'var(--color-danger)',
    icon: XCircle,
  },
];

const RADIUS = 50;
const STROKE_WIDTH = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SEGMENT_GAP = 5;

export function RsvpDonutChart({ breakdown }: RsvpDonutChartProps) {
  const total = SEGMENTS.reduce(
    (sum, segment) => sum + breakdown[segment.key],
    0,
  );
  const attendingPercent =
    total > 0 ? Math.round((breakdown.attending / total) * 100) : 0;

  let offset = 0;
  const arcs = SEGMENTS.map((segment) => {
    const value = breakdown[segment.key];
    const share = total > 0 ? value / total : 0;
    const rawLength = share * CIRCUMFERENCE;
    const arcLength = value > 0 ? Math.max(rawLength - SEGMENT_GAP, 1) : 0;
    const dashOffset = -offset;
    offset += rawLength;

    return { ...segment, value, arcLength, dashOffset };
  });

  return (
    <div className="flex items-center gap-4 lg:flex-col lg:gap-5">
      <div className="relative size-24 shrink-0 lg:size-40">
        <svg className="size-24 -rotate-90 lg:size-40" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            fill="none"
            r={RADIUS}
            stroke="var(--color-border)"
            strokeWidth={STROKE_WIDTH}
          />
          {total > 0
            ? arcs.map((arc) =>
                arc.value > 0 ? (
                  <circle
                    cx="60"
                    cy="60"
                    fill="none"
                    key={arc.key}
                    r={RADIUS}
                    stroke={arc.color}
                    strokeDasharray={`${arc.arcLength} ${CIRCUMFERENCE - arc.arcLength}`}
                    strokeDashoffset={arc.dashOffset}
                    strokeLinecap="butt"
                    strokeWidth={STROKE_WIDTH}
                  >
                    <title>
                      {arc.label}: {arc.value}
                    </title>
                  </circle>
                ) : null,
              )
            : null}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-1 text-center">
          <p className="text-base font-semibold text-slate-950 lg:text-3xl">
            {total > 0 ? `${attendingPercent}%` : '—'}
          </p>
          <p className="text-[9px] leading-tight text-slate-500 lg:text-xs">
            đã xác nhận tham dự
          </p>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-1.5 lg:w-full lg:space-y-2">
        {SEGMENTS.map((segment) => (
          <li
            className="flex items-center justify-between gap-2 text-xs lg:text-sm"
            key={segment.key}
          >
            <span className="flex items-center gap-1.5 text-slate-600 lg:gap-2">
              <segment.icon
                className="size-3.5 shrink-0 lg:size-4"
                style={{ color: segment.color }}
              />
              {segment.label}
            </span>
            <span className="font-semibold text-slate-950">
              {breakdown[segment.key]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
