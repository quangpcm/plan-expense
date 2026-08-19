'use client';

import Link from 'next/link';
import { MapPinned } from 'lucide-react';

import type { ExpenseDocument } from '@/modules/expense/types/expense';
import type { TravelActivityDocument } from '@/modules/travel-activity/types/travel-activity';
import { Badge } from '@/shared/components/ui/badge';

type ExpenseActivityLinkProps = {
  expense: ExpenseDocument;
  planId: string;
  travelActivities: TravelActivityDocument[];
  variant?: 'badge' | 'inline';
  interactive?: boolean;
};

export function ExpenseActivityLink({
  expense,
  planId,
  travelActivities,
  variant = 'badge',
  interactive = true,
}: ExpenseActivityLinkProps) {
  if (!expense.activityId) {
    return null;
  }

  const activity = travelActivities.find((item) => item.id === expense.activityId);

  if (!activity) {
    return null;
  }

  const label = activity.title;
  const href = `/plans/${planId}?tab=travelItinerary&activityId=${activity.id}`;

  if (variant === 'inline') {
    if (!interactive) {
      return (
        <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]">
          <MapPinned className="size-4 shrink-0" />
          <span className="truncate">Liên kết itinerary: {label}</span>
        </span>
      );
    }

    return (
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] transition hover:text-[color:color-mix(in_srgb,var(--color-primary)_78%,black)]"
        href={href}
      >
        <MapPinned className="size-4 shrink-0" />
        <span className="truncate">Liên kết itinerary: {label}</span>
      </Link>
    );
  }

  if (!interactive) {
    return (
      <Badge className="gap-1.5" variant="neutral">
        <MapPinned className="size-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </Badge>
    );
  }

  return (
    <Link href={href}>
      <Badge className="gap-1.5" variant="neutral">
        <MapPinned className="size-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </Badge>
    </Link>
  );
}
