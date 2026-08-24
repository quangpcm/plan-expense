'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Plus, Upload, UserRoundCheck, UsersRound } from 'lucide-react';

import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { hasPlanCapability } from '@/modules/member/services/permission.service';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import { GuestInvitationForm } from '@/modules/wedding-guest/components/guest-invitation-form';
import type { GuestInvitationFieldValues } from '@/modules/wedding-guest/components/guest-invitation-fields';
import { RsvpDonutChart } from '@/modules/wedding-guest/components/rsvp-donut-chart';
import { WeddingGuestCreateForm } from '@/modules/wedding-guest/components/wedding-guest-create-form';
import { WeddingGuestEditForm } from '@/modules/wedding-guest/components/wedding-guest-edit-form';
import {
  DEFAULT_WEDDING_GUEST_FILTERS,
  WeddingGuestFilterBar,
  type WeddingGuestFilters,
} from '@/modules/wedding-guest/components/wedding-guest-filter-bar';
import { WeddingGuestGroupList } from '@/modules/wedding-guest/components/wedding-guest-group-list';
import { WeddingGuestGroupNav } from '@/modules/wedding-guest/components/wedding-guest-group-nav';
import { WeddingGuestInsights } from '@/modules/wedding-guest/components/wedding-guest-insights';
import { WeddingGuestList } from '@/modules/wedding-guest/components/wedding-guest-list';
import { WeddingGuestListComposition } from '@/modules/wedding-guest/components/wedding-guest-list-composition';
import { WeddingGuestStatTiles } from '@/modules/wedding-guest/components/wedding-guest-stat-tiles';
import { WeddingGuestStats } from '@/modules/wedding-guest/components/wedding-guest-stats';
import type { WeddingGuestIdentityValues } from '@/modules/wedding-guest/components/wedding-guest-identity-fields';
import {
  getGuestRsvpLabel,
  getWeddingGuestInvitedByLabel,
  getWeddingGuestRelationshipLabel,
  getWeddingGuestSideLabel,
} from '@/modules/wedding-guest/constants/wedding-guest-presets';
import { useGuestInvitations } from '@/modules/wedding-guest/hooks/use-guest-invitations';
import { useWeddingGuestGroups } from '@/modules/wedding-guest/hooks/use-wedding-guest-groups';
import { useWeddingGuests } from '@/modules/wedding-guest/hooks/use-wedding-guests';
import {
  guestInvitationService,
  weddingGuestGroupService,
  weddingGuestService,
} from '@/modules/wedding-guest/services';
import type { GuestInvitationDocument } from '@/modules/wedding-guest/types/guest-invitation';
import type { WeddingGuestDocument } from '@/modules/wedding-guest/types/wedding-guest';
import type { WeddingGuestGroupDocument } from '@/modules/wedding-guest/types/wedding-guest-group';
import { normalizeVietnameseName } from '@/modules/wedding-guest/utils/normalize-name';
import {
  calculateOverallGuestStatistic,
  type GuestAttributeKey,
} from '@/modules/wedding-guest/utils/wedding-guest-statistic';
import { Badge } from '@/shared/components/ui/badge';
import { BottomSheet } from '@/shared/components/ui/bottom-sheet';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { ResponsiveModal } from '@/shared/components/ui/responsive-modal';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { Skeleton } from '@/shared/components/ui/skeleton';

type WeddingGuestPanelProps = {
  plan: PlanDocument;
  currentMember: PlanMemberDocument | null;
};

const GUEST_PREVIEW_LIMIT = 5;

function ViewAllAction({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="text-sm font-medium text-[var(--color-primary)] transition hover:text-[color:color-mix(in_srgb,var(--color-primary)_78%,black)]"
      onClick={onClick}
      type="button"
    >
      Xem tất cả ➔
    </button>
  );
}

const WeddingGuestImportDialog = dynamic(
  () =>
    import('@/modules/wedding-guest/components/wedding-guest-import-dialog').then(
      (module) => module.WeddingGuestImportDialog,
    ),
  { ssr: false },
);

const WeddingGuestExportDialog = dynamic(
  () =>
    import('@/modules/wedding-guest/components/wedding-guest-export-dialog').then(
      (module) => module.WeddingGuestExportDialog,
    ),
  { ssr: false },
);

export function WeddingGuestPanel({
  plan,
  currentMember,
}: WeddingGuestPanelProps) {
  const { user } = useAuthSession();
  const {
    groups,
    isLoading: isGroupsLoading,
    errorMessage: groupsWatchError,
  } = useWeddingGuestGroups(plan.id);
  const {
    guests,
    isLoading: isGuestsLoading,
    errorMessage: guestsWatchError,
  } = useWeddingGuests(plan.id);
  const {
    invitations,
    isLoading: isInvitationsLoading,
    errorMessage: invitationsWatchError,
  } = useGuestInvitations(plan.id);

  const canManage =
    hasPlanCapability(currentMember, 'weddingGuests.manageGuest') &&
    plan.status === 'active';

  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<WeddingGuestFilters>(
    DEFAULT_WEDDING_GUEST_FILTERS,
  );
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [showGuestListModal, setShowGuestListModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [editingGuest, setEditingGuest] = useState<WeddingGuestDocument | null>(
    null,
  );
  const [editingInvitation, setEditingInvitation] =
    useState<GuestInvitationDocument | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const hasAutoSelectedGroupRef = useRef(false);

  useEffect(() => {
    const firstGroup = groups[0];

    if (!hasAutoSelectedGroupRef.current && firstGroup) {
      hasAutoSelectedGroupRef.current = true;
      setActiveGroupId(firstGroup.id);
    }
  }, [groups]);

  const activeGroup =
    groups.find((group) => group.id === activeGroupId) ?? null;
  const editingInvitationGuest = editingInvitation
    ? (guests.find((guest) => guest.id === editingInvitation.guestId) ?? null)
    : null;

  const { rows, filteredInvitations } = useMemo(() => {
    const guestById = new Map(guests.map((guest) => [guest.id, guest]));
    const normalizedQuery = normalizeVietnameseName(searchQuery);

    function matchesIdentityFilters(guest: WeddingGuestDocument) {
      if (normalizedQuery && !guest.normalizedName.includes(normalizedQuery)) {
        return false;
      }

      if (filters.sideId !== 'all' && guest.sideId !== filters.sideId) {
        return false;
      }

      if (
        filters.relationshipId !== 'all' &&
        guest.relationshipId !== filters.relationshipId
      ) {
        return false;
      }

      if (
        filters.invitedById !== 'all' &&
        guest.invitedById !== filters.invitedById
      ) {
        return false;
      }

      return true;
    }

    if (activeGroupId) {
      const matchingInvitations = invitations
        .filter((invitation) => invitation.groupId === activeGroupId)
        .filter((invitation) => {
          if (filters.rsvp !== 'all' && invitation.rsvp !== filters.rsvp) {
            return false;
          }

          const guest = guestById.get(invitation.guestId);

          return guest ? matchesIdentityFilters(guest) : false;
        });

      const groupRows = matchingInvitations
        .map((invitation) => ({
          invitation,
          guest: guestById.get(invitation.guestId),
        }))
        .filter(
          (
            row,
          ): row is {
            invitation: GuestInvitationDocument;
            guest: WeddingGuestDocument;
          } => Boolean(row.guest),
        );

      return { rows: groupRows, filteredInvitations: matchingInvitations };
    }

    const matchingGuests = guests.filter((guest) =>
      matchesIdentityFilters(guest),
    );
    const matchingGuestIds = new Set(matchingGuests.map((guest) => guest.id));
    const allGroupsRows = matchingGuests.map((guest) => ({
      guest,
      groupCount: invitations.filter(
        (invitation) => invitation.guestId === guest.id,
      ).length,
    }));
    const matchingInvitations = invitations.filter((invitation) =>
      matchingGuestIds.has(invitation.guestId),
    );

    return { rows: allGroupsRows, filteredInvitations: matchingInvitations };
  }, [activeGroupId, filters, guests, invitations, searchQuery]);

  const previewRows = useMemo(() => rows.slice(0, GUEST_PREVIEW_LIMIT), [rows]);

  const scopedInvitations = useMemo(
    () =>
      activeGroupId
        ? invitations.filter(
            (invitation) => invitation.groupId === activeGroupId,
          )
        : invitations,
    [activeGroupId, invitations],
  );
  const scopedStat = useMemo(
    () => calculateOverallGuestStatistic(scopedInvitations),
    [scopedInvitations],
  );
  const filteredStat = useMemo(
    () => calculateOverallGuestStatistic(filteredInvitations),
    [filteredInvitations],
  );
  const activeFilterChips = useMemo(() => {
    const chips: string[] = [];

    if (filters.sideId !== 'all') {
      chips.push(`Phía: ${getWeddingGuestSideLabel(filters.sideId)}`);
    }

    if (filters.relationshipId !== 'all') {
      chips.push(
        `Quan hệ: ${getWeddingGuestRelationshipLabel(filters.relationshipId)}`,
      );
    }

    if (filters.invitedById !== 'all') {
      chips.push(
        `Khách của: ${getWeddingGuestInvitedByLabel(filters.invitedById)}`,
      );
    }

    if (activeGroupId && filters.rsvp !== 'all') {
      chips.push(`Xác nhận: ${getGuestRsvpLabel(filters.rsvp)}`);
    }

    if (searchQuery.trim()) {
      chips.push(`Tìm: "${searchQuery.trim()}"`);
    }

    return chips;
  }, [activeGroupId, filters, searchQuery]);

  function resetActionState() {
    setActionError(null);
  }

  function handleSelectAttribute(
    attributeKey: GuestAttributeKey,
    attributeId: string,
  ) {
    setFilters({
      ...DEFAULT_WEDDING_GUEST_FILTERS,
      [attributeKey]: attributeId,
    });
    setShowGuestListModal(true);
  }

  function handleViewPendingList(groupId: string | null) {
    if (groupId && groupId !== activeGroupId) {
      setActiveGroupId(groupId);
    }

    setFilters({ ...DEFAULT_WEDDING_GUEST_FILTERS, rsvp: 'pending' });
    setShowGuestListModal(true);
  }

  async function handleCreateGroup(name: string) {
    if (!user) {
      return;
    }

    resetActionState();
    setIsSubmitting(true);

    try {
      await weddingGuestGroupService.createGroup(
        plan,
        { name },
        user,
        currentMember,
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Hiện chưa thể tạo nhóm này.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateGroup(
    group: WeddingGuestGroupDocument,
    name: string,
  ) {
    resetActionState();
    setIsSubmitting(true);

    try {
      await weddingGuestGroupService.updateGroup(
        plan,
        { groupId: group.id, name },
        currentMember,
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể cập nhật nhóm này.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteGroup(group: WeddingGuestGroupDocument) {
    const invitationCount = invitations.filter(
      (invitation) => invitation.groupId === group.id,
    ).length;
    const confirmed = window.confirm(
      invitationCount > 0
        ? `Xóa nhóm "${group.name}"? ${invitationCount} lượt mời trong nhóm này sẽ bị xóa theo. Hành động này không thể hoàn tác.`
        : `Xóa nhóm "${group.name}"? Hành động này không thể hoàn tác.`,
    );

    if (!confirmed) {
      return;
    }

    resetActionState();
    setIsSubmitting(true);

    try {
      await weddingGuestGroupService.deleteGroup(plan, group.id, currentMember);

      if (activeGroupId === group.id) {
        setActiveGroupId(null);
      }
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Hiện chưa thể xóa nhóm này.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateNewGuest(
    identity: WeddingGuestIdentityValues,
    invitationDetails: GuestInvitationFieldValues,
  ) {
    if (
      !user ||
      !activeGroupId ||
      !identity.sideId ||
      !identity.relationshipId ||
      !identity.invitedById
    ) {
      return;
    }

    resetActionState();
    setIsSubmitting(true);

    try {
      await weddingGuestService.createGuest(
        plan,
        {
          name: identity.name,
          sideId: identity.sideId,
          relationshipId: identity.relationshipId,
          invitedById: identity.invitedById,
          groupId: activeGroupId,
          rsvp: invitationDetails.rsvp,
          attendeeCount: invitationDetails.attendeeCount,
          moneyGiftAmount: invitationDetails.moneyGiftAmount || undefined,
          goldGiftAmount: invitationDetails.goldGiftAmount || undefined,
          goldGiftNote: invitationDetails.goldGiftNote || undefined,
          note: invitationDetails.note || undefined,
        },
        user,
        currentMember,
      );
      setShowCreateForm(false);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể thêm khách này.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddExistingGuestToGroup(guestId: string) {
    if (!user || !activeGroupId) {
      return;
    }

    resetActionState();
    setIsSubmitting(true);

    try {
      await guestInvitationService.addInvitation(
        plan,
        {
          guestId,
          groupId: activeGroupId,
          rsvp: 'pending',
          attendeeCount: 1,
        },
        user,
        currentMember,
      );
      setShowCreateForm(false);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể thêm khách này vào nhóm.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateGuestIdentity(
    identity: WeddingGuestIdentityValues,
  ) {
    if (
      !editingGuest ||
      !identity.sideId ||
      !identity.relationshipId ||
      !identity.invitedById
    ) {
      return;
    }

    resetActionState();
    setIsSubmitting(true);

    try {
      await weddingGuestService.updateGuest(
        plan,
        {
          guestId: editingGuest.id,
          name: identity.name,
          sideId: identity.sideId,
          relationshipId: identity.relationshipId,
          invitedById: identity.invitedById,
        },
        currentMember,
      );
      setEditingGuest(null);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể cập nhật khách này.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteGuest(guest: WeddingGuestDocument) {
    const groupCount = new Set(
      invitations
        .filter((invitation) => invitation.guestId === guest.id)
        .map((invitation) => invitation.groupId),
    ).size;
    const confirmed = window.confirm(
      groupCount > 0
        ? `Xóa khách "${guest.name}"? Khách này đang thuộc ${groupCount} nhóm, toàn bộ lượt mời sẽ bị xóa theo. Hành động này không thể hoàn tác.`
        : `Xóa khách "${guest.name}"? Hành động này không thể hoàn tác.`,
    );

    if (!confirmed) {
      return;
    }

    resetActionState();
    setIsSubmitting(true);

    try {
      await weddingGuestService.deleteGuest(plan, guest.id, currentMember);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Hiện chưa thể xóa khách này.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveGuestInvitation(
    identity: WeddingGuestIdentityValues,
    values: GuestInvitationFieldValues,
  ) {
    if (
      !editingInvitation ||
      !identity.sideId ||
      !identity.relationshipId ||
      !identity.invitedById
    ) {
      return;
    }

    resetActionState();
    setIsSubmitting(true);

    try {
      await weddingGuestService.updateGuest(
        plan,
        {
          guestId: editingInvitation.guestId,
          name: identity.name,
          sideId: identity.sideId,
          relationshipId: identity.relationshipId,
          invitedById: identity.invitedById,
        },
        currentMember,
      );
      await guestInvitationService.updateInvitation(
        plan,
        {
          invitationId: editingInvitation.id,
          rsvp: values.rsvp,
          attendeeCount: values.attendeeCount,
          moneyGiftAmount: values.moneyGiftAmount || undefined,
          goldGiftAmount: values.goldGiftAmount || undefined,
          goldGiftNote: values.goldGiftNote || undefined,
          note: values.note || undefined,
        },
        currentMember,
      );
      setEditingInvitation(null);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể cập nhật thông tin khách này.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveInvitation() {
    if (!editingInvitation) {
      return;
    }

    const confirmed = window.confirm(
      'Xóa khách này khỏi nhóm hiện tại? Hành động này không thể hoàn tác.',
    );

    if (!confirmed) {
      return;
    }

    resetActionState();
    setIsSubmitting(true);

    try {
      await guestInvitationService.deleteInvitation(
        plan,
        editingInvitation.id,
        currentMember,
      );
      setEditingInvitation(null);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể xóa khách khỏi nhóm này.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const watchError =
    groupsWatchError || guestsWatchError || invitationsWatchError;

  if (isGroupsLoading || isGuestsLoading || isInvitationsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-[28px]" />
        <Skeleton className="h-52 rounded-[28px]" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      {watchError ? (
        <AuthFormMessage message={watchError} type="error" />
      ) : null}

      <WeddingGuestStatTiles
        attendeeCount={scopedStat.attendeeCount}
        goldGiftTotal={scopedStat.goldGiftTotal}
        guestCount={scopedStat.guestCount}
        moneyGiftTotal={scopedStat.moneyGiftTotal}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr] lg:items-start">
        <div className="space-y-5">
          <Card>
            <SectionHeading eyebrow="Thống kê" title="Tiến độ xác nhận" />
            <RsvpDonutChart breakdown={scopedStat.rsvpBreakdown} />
          </Card>

          <WeddingGuestGroupNav
            activeGroupId={activeGroupId}
            canManage={canManage}
            groups={groups}
            onManageGroups={() => setShowGroupManager(true)}
            onSelectGroup={setActiveGroupId}
          />

          <WeddingGuestInsights
            guests={guests}
            invitations={scopedInvitations}
          />
        </div>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeading eyebrow="Khách mời" title="Danh sách khách mời" />
            <div className="flex flex-wrap items-center gap-2">
              {canManage ? (
                <>
                  <Button
                    className="hidden shrink-0 lg:inline-flex"
                    onClick={() => setShowImportDialog(true)}
                    variant="secondary"
                  >
                    <Upload className="size-4" />
                    Import
                  </Button>
                  <Button
                    className="hidden shrink-0 lg:inline-flex"
                    onClick={() => setShowExportDialog(true)}
                    variant="secondary"
                  >
                    <Download className="size-4" />
                    Export
                  </Button>
                </>
              ) : null}
              {canManage && activeGroupId ? (
                <Button
                  className="hidden shrink-0 lg:inline-flex"
                  onClick={() => setShowCreateForm(true)}
                  variant="secondary"
                >
                  <Plus className="size-4" />
                  Thêm khách
                </Button>
              ) : null}
              <ViewAllAction onClick={() => setShowGuestListModal(true)} />
            </div>
          </div>

          <WeddingGuestFilterBar
            filters={filters}
            onFiltersChange={setFilters}
            onSearchQueryChange={setSearchQuery}
            searchQuery={searchQuery}
            showRsvpFilter={activeGroupId !== null}
          />

          {actionError ? (
            <AuthFormMessage message={actionError} type="error" />
          ) : null}

          <WeddingGuestList
            emptyMessage={
              activeGroupId
                ? 'Chưa có khách nào trong nhóm này.'
                : 'Chưa có khách mời nào. Chọn một nhóm/tiệc để bắt đầu thêm khách.'
            }
            onDeleteGuest={
              !activeGroupId && canManage ? handleDeleteGuest : undefined
            }
            onSelectRow={(row) => {
              if (activeGroupId && row.invitation) {
                setEditingInvitation(row.invitation);
              } else {
                setEditingGuest(row.guest);
              }
            }}
            rows={previewRows}
          />

          {rows.length > GUEST_PREVIEW_LIMIT ? (
            <button
              className="w-full rounded-2xl bg-slate-50 py-2.5 text-sm font-medium text-[var(--color-primary)] transition hover:bg-slate-100"
              onClick={() => setShowGuestListModal(true)}
              type="button"
            >
              Xem thêm
            </button>
          ) : null}
        </Card>
      </div>

      <WeddingGuestStats
        activeGroupId={activeGroupId}
        groups={groups}
        guests={guests}
        invitations={invitations}
        onSelectAttribute={handleSelectAttribute}
        onViewPendingList={handleViewPendingList}
        scopedInvitations={scopedInvitations}
        scopedStat={scopedStat}
      />

      <ResponsiveModal
        className="max-h-[85vh] w-full max-w-4xl overflow-y-auto"
        onOpenChange={setShowGuestListModal}
        open={showGuestListModal}
        title="Danh sách khách mời"
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">
              {activeGroup ? activeGroup.name : 'Tất cả nhóm/tiệc'}
            </Badge>
            {activeFilterChips.map((chip) => (
              <Badge key={chip} variant="info">
                {chip}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1 rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 text-slate-400">
                <UsersRound className="size-3.5" />
                <p className="text-[10px] uppercase tracking-[0.1em]">
                  Khách mời
                </p>
              </div>
              <p className="text-lg font-semibold text-slate-950">
                {filteredStat.guestCount}
              </p>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center gap-1.5 text-slate-400">
                <UserRoundCheck className="size-3.5" />
                <p className="text-[10px] uppercase tracking-[0.1em]">
                  Dự kiến tham dự
                </p>
              </div>
              <p className="text-lg font-semibold text-slate-950">
                {filteredStat.attendeeCount}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <SectionHeading eyebrow="Tổng hợp" title="Cơ cấu khách mời" />
            <WeddingGuestListComposition
              guests={guests}
              invitations={filteredInvitations}
            />
          </div>

          <Input
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm khách theo tên..."
            value={searchQuery}
          />

          <WeddingGuestList
            emptyMessage={
              activeGroupId
                ? 'Chưa có khách nào trong nhóm này.'
                : 'Chưa có khách mời nào. Chọn một nhóm/tiệc để bắt đầu thêm khách.'
            }
            onDeleteGuest={
              !activeGroupId && canManage ? handleDeleteGuest : undefined
            }
            onSelectRow={(row) => {
              if (activeGroupId && row.invitation) {
                setEditingInvitation(row.invitation);
              } else {
                setEditingGuest(row.guest);
              }
            }}
            rows={rows}
          />
        </div>
      </ResponsiveModal>

      {canManage && activeGroupId ? (
        <button
          aria-label={`Thêm khách vào ${activeGroup?.name ?? ''}`}
          className="fixed right-4 bottom-24 z-30 flex size-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-[0_14px_34px_rgba(36,59,107,0.32)] transition hover:bg-[var(--color-primary-hover)] lg:hidden"
          onClick={() => setShowCreateForm(true)}
          type="button"
        >
          <Plus className="size-6" />
        </button>
      ) : null}

      <BottomSheet
        onClose={() => setShowGroupManager(false)}
        open={showGroupManager}
        title="Quản lý nhóm/tiệc"
      >
        <WeddingGuestGroupList
          canManage={canManage}
          errorMessage={actionError}
          groups={groups}
          isSubmitting={isSubmitting}
          onCreateGroup={handleCreateGroup}
          onDeleteGroup={handleDeleteGroup}
          onUpdateGroup={handleUpdateGroup}
        />
      </BottomSheet>

      <WeddingGuestImportDialog
        currentMember={currentMember}
        groups={groups}
        guests={guests}
        invitations={invitations}
        onClose={() => setShowImportDialog(false)}
        open={showImportDialog}
        plan={plan}
      />

      <WeddingGuestExportDialog
        groups={groups}
        guests={guests}
        invitations={invitations}
        onClose={() => setShowExportDialog(false)}
        open={showExportDialog}
      />

      <BottomSheet
        onClose={() => setShowCreateForm(false)}
        open={showCreateForm && Boolean(activeGroup)}
        title={`Thêm khách vào ${activeGroup?.name ?? ''}`}
      >
        {activeGroup ? (
          <WeddingGuestCreateForm
            errorMessage={actionError}
            existingGuests={guests}
            groupId={activeGroup.id}
            groupName={activeGroup.name}
            groups={groups}
            invitations={invitations}
            isSubmitting={isSubmitting}
            onAddExistingGuestToGroup={handleAddExistingGuestToGroup}
            onCancel={() => setShowCreateForm(false)}
            onCreateNewGuest={handleCreateNewGuest}
          />
        ) : null}
      </BottomSheet>

      <BottomSheet
        onClose={() => setEditingGuest(null)}
        open={Boolean(editingGuest)}
        title="Chỉnh sửa khách mời"
      >
        {editingGuest ? (
          <WeddingGuestEditForm
            errorMessage={actionError}
            existingGuests={guests}
            guest={editingGuest}
            isSubmitting={isSubmitting}
            onCancel={() => setEditingGuest(null)}
            onSave={handleUpdateGuestIdentity}
          />
        ) : null}
      </BottomSheet>

      <BottomSheet
        onClose={() => setEditingInvitation(null)}
        open={Boolean(editingInvitation)}
        title="Chỉnh sửa khách mời"
      >
        {editingInvitation && editingInvitationGuest ? (
          <GuestInvitationForm
            errorMessage={actionError}
            existingGuests={guests}
            guest={editingInvitationGuest}
            invitation={editingInvitation}
            isSubmitting={isSubmitting}
            onCancel={() => setEditingInvitation(null)}
            onRemoveFromGroup={handleRemoveInvitation}
            onSave={handleSaveGuestInvitation}
          />
        ) : null}
      </BottomSheet>
    </div>
  );
}
