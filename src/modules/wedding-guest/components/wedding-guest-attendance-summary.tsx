import type { GuestAggregateStatistic } from '@/modules/wedding-guest/utils/wedding-guest-statistic';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';

type WeddingGuestAttendanceSummaryProps = {
  stat: GuestAggregateStatistic;
};

export function WeddingGuestAttendanceSummary({
  stat,
}: WeddingGuestAttendanceSummaryProps) {
  const rows = [
    {
      key: 'attending',
      label: 'thiệp đã xác nhận',
      invitationCount: stat.rsvpBreakdown.attending,
      attendeeCount: stat.attendeeCountByRsvp.attending,
    },
    {
      key: 'pending',
      label: 'thiệp chờ xác nhận',
      invitationCount: stat.rsvpBreakdown.pending,
      attendeeCount: stat.attendeeCountByRsvp.pending,
    },
    {
      key: 'not_attending',
      label: 'thiệp báo vắng',
      invitationCount: stat.rsvpBreakdown.not_attending,
      attendeeCount: stat.attendeeCountByRsvp.not_attending,
    },
  ];

  return (
    <Card>
      <SectionHeading eyebrow="Tổng hợp khách mời" title="Quy mô tham dự" />

      <p className="text-3xl font-semibold text-[var(--color-text-primary)]">
        {stat.attendeeCount}
        <span className="ml-1.5 text-sm font-normal text-[var(--color-text-muted)]">
          người dự kiến
        </span>
      </p>

      <ul className="space-y-2 text-sm">
        {rows.map((row) => (
          <li
            className="flex items-center justify-between gap-2 text-[var(--color-text-secondary)]"
            key={row.key}
          >
            <span>
              {row.invitationCount} {row.label}
            </span>
            <span className="font-medium text-[var(--color-text-primary)]">
              {row.attendeeCount} người
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
