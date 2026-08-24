import { WeddingGuestActionNeeded } from '@/modules/wedding-guest/components/wedding-guest-action-needed';
import { WeddingGuestAttendanceSummary } from '@/modules/wedding-guest/components/wedding-guest-attendance-summary';
import { WeddingGuestCompositionCard } from '@/modules/wedding-guest/components/wedding-guest-composition-card';
import { WeddingGuestGroupTable } from '@/modules/wedding-guest/components/wedding-guest-group-table';
import type { GuestInvitationDocument } from '@/modules/wedding-guest/types/guest-invitation';
import type { WeddingGuestDocument } from '@/modules/wedding-guest/types/wedding-guest';
import type { WeddingGuestGroupDocument } from '@/modules/wedding-guest/types/wedding-guest-group';
import type {
  GuestAggregateStatistic,
  GuestAttributeKey,
} from '@/modules/wedding-guest/utils/wedding-guest-statistic';

type WeddingGuestStatsProps = {
  groups: WeddingGuestGroupDocument[];
  guests: WeddingGuestDocument[];
  invitations: GuestInvitationDocument[];
  scopedInvitations: GuestInvitationDocument[];
  scopedStat: GuestAggregateStatistic;
  activeGroupId: string | null;
  onSelectAttribute: (
    attributeKey: GuestAttributeKey,
    attributeId: string,
  ) => void;
  onViewPendingList: (groupId: string | null) => void;
};

export function WeddingGuestStats({
  groups,
  guests,
  invitations,
  scopedInvitations,
  scopedStat,
  activeGroupId,
  onSelectAttribute,
  onViewPendingList,
}: WeddingGuestStatsProps) {
  return (
    <div className="space-y-5">
      <WeddingGuestGroupTable
        activeGroupId={activeGroupId}
        groups={groups}
        invitations={invitations}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeddingGuestActionNeeded
            activeGroupId={activeGroupId}
            groups={groups}
            invitations={invitations}
            onViewPendingList={onViewPendingList}
          />
        </div>
        <WeddingGuestAttendanceSummary stat={scopedStat} />
      </div>

      <WeddingGuestCompositionCard
        guests={guests}
        invitations={scopedInvitations}
        onSelectAttribute={onSelectAttribute}
      />
    </div>
  );
}
