import { CircleAlert } from 'lucide-react';

import type { GuestInvitationDocument } from '@/modules/wedding-guest/types/guest-invitation';
import type { WeddingGuestGroupDocument } from '@/modules/wedding-guest/types/wedding-guest-group';
import {
  calculateGuestStatisticByGroup,
  calculateOverallGuestStatistic,
} from '@/modules/wedding-guest/utils/wedding-guest-statistic';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';

type WeddingGuestActionNeededProps = {
  groups: WeddingGuestGroupDocument[];
  invitations: GuestInvitationDocument[];
  activeGroupId: string | null;
  onViewPendingList: (groupId: string | null) => void;
};

function ViewListLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="shrink-0 text-sm font-medium text-[var(--color-primary)] transition hover:text-[color:color-mix(in_srgb,var(--color-primary)_78%,black)]"
      onClick={onClick}
      type="button"
    >
      Xem danh sách →
    </button>
  );
}

export function WeddingGuestActionNeeded({
  groups,
  invitations,
  activeGroupId,
  onViewPendingList,
}: WeddingGuestActionNeededProps) {
  const activeGroup = activeGroupId
    ? (groups.find((group) => group.id === activeGroupId) ?? null)
    : null;

  const rows = activeGroupId
    ? []
    : calculateGuestStatisticByGroup(groups, invitations).filter(
        (row) => row.rsvpBreakdown.pending > 0,
      );

  const scopedPendingCount = activeGroupId
    ? calculateOverallGuestStatistic(
        invitations.filter(
          (invitation) => invitation.groupId === activeGroupId,
        ),
      ).rsvpBreakdown.pending
    : 0;

  const hasNothingToHandle = activeGroupId
    ? scopedPendingCount === 0
    : rows.length === 0;

  return (
    <Card>
      <SectionHeading eyebrow="Tổng hợp khách mời" title="Cần xử lý" />

      {hasNothingToHandle ? (
        <p className="text-sm text-slate-500">Không có việc cần xử lý.</p>
      ) : activeGroupId ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50 px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-slate-800">
            <CircleAlert className="size-4 shrink-0 text-amber-500" />
            <strong className="font-semibold">
              {scopedPendingCount} khách
            </strong>{' '}
            chưa xác nhận{activeGroup ? ` cho ${activeGroup.name}` : ''}
          </span>
          <ViewListLink onClick={() => onViewPendingList(activeGroupId)} />
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50 px-4 py-3"
              key={row.group.id}
            >
              <span className="flex items-center gap-2 text-sm text-slate-800">
                <CircleAlert className="size-4 shrink-0 text-amber-500" />
                <strong className="font-semibold">
                  {row.rsvpBreakdown.pending} khách
                </strong>{' '}
                chưa xác nhận cho {row.group.name}
              </span>
              <ViewListLink onClick={() => onViewPendingList(row.group.id)} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
