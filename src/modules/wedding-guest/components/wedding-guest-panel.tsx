'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Plus, Upload } from 'lucide-react';

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
import {
  WeddingGuestList,
  type WeddingGuestListRow,
} from '@/modules/wedding-guest/components/wedding-guest-list';
import { WeddingGuestStatTiles } from '@/modules/wedding-guest/components/wedding-guest-stat-tiles';
import { WeddingGuestStats } from '@/modules/wedding-guest/components/wedding-guest-stats';
import type { WeddingGuestIdentityValues } from '@/modules/wedding-guest/components/wedding-guest-identity-fields';
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
import { calculateOverallGuestStatistic } from '@/modules/wedding-guest/utils/wedding-guest-statistic';
import { BottomSheet } from '@/shared/components/ui/bottom-sheet';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
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
    import(
      '@/modules/wedding-guest/components/wedding-guest-import-dialog'
    ).then((module) => module.WeddingGuestImportDialog),
  { ssr: false },
);

const WeddingGuestExportDialog = dynamic(
  () =>
    import(
      '@/modules/wedding-guest/components/wedding-guest-export-dialog'
    ).then((module) => module.WeddingGuestExportDialog),
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

  const rows: WeddingGuestListRow[] = useMemo(() => {
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
      return invitations
        .filter((invitation) => invitation.groupId === activeGroupId)
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
        )
        .filter((row) => {
          if (filters.rsvp !== 'all' && row.invitation.rsvp !== filters.rsvp) {
            return false;
          }

          return matchesIdentityFilters(row.guest);
        })
        .map((row) => ({ guest: row.guest, invitation: row.invitation }));
    }

    return guests
      .filter((guest) => matchesIdentityFilters(guest))
      .map((guest) => ({
        guest,
        groupCount: invitations.filter(
          (invitation) => invitation.guestId === guest.id,
        ).length,
      }));
  }, [activeGroupId, filters, guests, invitations, searchQuery]);

  const previewRows = useMemo(
    () => rows.slice(0, GUEST_PREVIEW_LIMIT),
    [rows],
  );

  const scopedStat = useMemo(() => {
    const scopedInvitations = activeGroupId
      ? invitations.filter((invitation) => invitation.groupId === activeGroupId)
      : invitations;

    return calculateOverallGuestStatistic(scopedInvitations);
  }, [activeGroupId, invitations]);

  function resetActionState() {
    setActionError(null);
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
            groups={groups}
            guests={guests}
            invitations={invitations}
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
        </Card>
      </div>

      <WeddingGuestStats
        groups={groups}
        guests={guests}
        invitations={invitations}
      />

      <ResponsiveModal
        className="max-h-[85vh] w-full max-w-4xl overflow-y-auto"
        onOpenChange={setShowGuestListModal}
        open={showGuestListModal}
        title="Danh sách khách mời"
      >
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
