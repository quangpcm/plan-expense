import type { GuestInvitationRepository } from '@/modules/wedding-guest/repositories/guest-invitation.repository';
import type { WeddingGuestGroupService } from '@/modules/wedding-guest/services/wedding-guest-group.service';
import type { WeddingGuestRepository } from '@/modules/wedding-guest/repositories/wedding-guest.repository';
import type {
  ImportGuestUnit,
  ImportInvitationRow,
} from '@/modules/wedding-guest/types/wedding-guest-import';
import type { AuthUser } from '@/modules/auth/types/auth';
import { hasPlanCapability } from '@/modules/member/services/permission.service';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import { AppError } from '@/shared/errors/app-error';
import { normalizeVietnameseName } from '@/modules/wedding-guest/utils/normalize-name';

function toNullableNonNegativeInt(value: number | null) {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.trunc(value);
}

function toNonNegativeInt(value: number, fallback: number) {
  if (!Number.isFinite(value) || value < 0) {
    return fallback;
  }

  return Math.trunc(value);
}

type CommitImportSummary = {
  createdGuestCount: number;
  createdInvitationCount: number;
  syncedInvitationCount: number;
  syncedGuestCount: number;
  skippedCount: number;
};

export class WeddingGuestImportService {
  constructor(
    private readonly weddingGuestRepository: WeddingGuestRepository,
    private readonly guestInvitationRepository: GuestInvitationRepository,
    private readonly weddingGuestGroupService: WeddingGuestGroupService,
  ) {}

  private assertManageWeddingGuestPermission(
    currentMember: PlanMemberDocument | null,
  ) {
    if (!hasPlanCapability(currentMember, 'weddingGuests.manageGuest')) {
      throw new AppError(
        'Bạn không có quyền quản lý khách mời.',
        'WEDDING_GUEST_PERMISSION_DENIED',
        403,
      );
    }
  }

  private assertEditablePlan(plan: PlanDocument) {
    if (plan.status !== 'active') {
      throw new AppError(
        'Kế hoạch này đã kết thúc và không thể chỉnh sửa.',
        'PLAN_ENDED',
        400,
      );
    }
  }

  async commitImport(
    plan: PlanDocument,
    resolvedUnits: ImportGuestUnit[],
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ): Promise<CommitImportSummary> {
    this.assertEditablePlan(plan);
    this.assertManageWeddingGuestPermission(currentMember);

    const summary: CommitImportSummary = {
      createdGuestCount: 0,
      createdInvitationCount: 0,
      syncedInvitationCount: 0,
      syncedGuestCount: 0,
      skippedCount: 0,
    };

    const groupIdByNormalizedName = new Map<string, string>();

    for (const unit of resolvedUnits) {
      for (const invitation of unit.invitations) {
        if (invitation.resolvedGroupId) {
          groupIdByNormalizedName.set(
            normalizeVietnameseName(invitation.groupNameRaw),
            invitation.resolvedGroupId,
          );
        }
      }
    }

    for (const unit of resolvedUnits) {
      for (const invitation of unit.invitations) {
        const normalizedGroupName = normalizeVietnameseName(
          invitation.groupNameRaw,
        );

        if (!invitation.resolvedGroupId) {
          const existingGroupId = groupIdByNormalizedName.get(normalizedGroupName);

          if (existingGroupId) {
            invitation.resolvedGroupId = existingGroupId;
            invitation.isNewGroup = false;
            continue;
          }

          const createdGroup = await this.weddingGuestGroupService.createGroup(
            plan,
            { name: invitation.groupNameRaw },
            currentUser,
            currentMember,
          );
          groupIdByNormalizedName.set(normalizedGroupName, createdGroup.groupId);
          invitation.resolvedGroupId = createdGroup.groupId;
          invitation.isNewGroup = false;
        }
      }
    }

    const guestCreateInputs: Parameters<
      WeddingGuestRepository['bulkCreateGuestsWithInvitations']
    >[0] = [];
    const invitationUpserts: Parameters<
      GuestInvitationRepository['bulkUpsertInvitations']
    >[0] = [];

    for (const unit of resolvedUnits) {
      const validInvitations = unit.invitations.filter(
        (invitation) =>
          invitation.status !== 'invalid' && invitation.selectedAction !== 'skip',
      );

      if (unit.guestDecision === 'skip' || validInvitations.length === 0) {
        summary.skippedCount += unit.invitations.length;
        continue;
      }

      if (
        unit.guestDecision === 'create_new' ||
        (unit.matchStatus === 'new' && !unit.guestDecision)
      ) {
        const invitationInputs = validInvitations
          .filter((invitation) => Boolean(invitation.resolvedGroupId))
          .map((invitation) => ({
            planId: plan.id,
            groupId: invitation.resolvedGroupId as string,
            rsvp: invitation.rsvp,
            attendeeCount: toNonNegativeInt(invitation.attendeeCount, 1),
            moneyGiftAmount: toNullableNonNegativeInt(
              invitation.moneyGiftAmount,
            ),
            goldGiftAmount: toNullableNonNegativeInt(invitation.goldGiftAmount),
            goldGiftNote: invitation.goldGiftNote?.trim() || null,
            note: invitation.note?.trim() || null,
          }));

        if (invitationInputs.length > 0) {
          guestCreateInputs.push({
            planId: plan.id,
            name: unit.name.trim(),
            normalizedName: unit.normalizedName,
            sideId: unit.sideId,
            relationshipId: unit.relationshipId,
            invitedById: unit.invitedById,
            createdByUserId: currentUser.uid,
            invitations: invitationInputs,
          });
        }
        continue;
      }

      const resolvedGuest =
        unit.resolvedGuest ??
        (unit.candidateMatches[0]?.guest ?? null);

      if (!resolvedGuest) {
        summary.skippedCount += unit.invitations.length;
        continue;
      }

      if (unit.guestDecision === 'use_existing_sync') {
        await this.weddingGuestRepository.updateGuest(plan.id, {
          guestId: resolvedGuest.id,
          name: unit.name.trim(),
          normalizedName: unit.normalizedName,
          sideId: unit.sideId,
          relationshipId: unit.relationshipId,
          invitedById: unit.invitedById,
        });
        summary.syncedGuestCount += 1;
      }

      validInvitations.forEach((invitation) => {
        const upsert = this.buildInvitationUpsert(
          plan.id,
          resolvedGuest.id,
          invitation,
          currentUser.uid,
        );

        if (upsert) {
          invitationUpserts.push(upsert);
        }
      });
    }

    const createdResults =
      guestCreateInputs.length > 0
        ? await this.weddingGuestRepository.bulkCreateGuestsWithInvitations(
            guestCreateInputs,
          )
        : [];

    if (invitationUpserts.length > 0) {
      await this.guestInvitationRepository.bulkUpsertInvitations(
        invitationUpserts,
      );
    }

    summary.createdGuestCount = new Set(
      createdResults.map((result) => result.guestId),
    ).size;
    summary.createdInvitationCount =
      createdResults.length +
      invitationUpserts.filter((item) => item.mode === 'create').length;
    summary.syncedInvitationCount = invitationUpserts.filter(
      (item) => item.mode === 'sync',
    ).length;

    return summary;
  }

  private buildInvitationUpsert(
    planId: string,
    guestId: string,
    invitation: ImportInvitationRow,
    createdByUserId: string,
  ) {
    if (!invitation.resolvedGroupId) {
      return null;
    }

    if (invitation.selectedAction === 'create') {
      return {
        mode: 'create' as const,
        planId,
        guestId,
        groupId: invitation.resolvedGroupId,
        rsvp: invitation.rsvp,
        attendeeCount: toNonNegativeInt(invitation.attendeeCount, 1),
        moneyGiftAmount: toNullableNonNegativeInt(invitation.moneyGiftAmount),
        goldGiftAmount: toNullableNonNegativeInt(invitation.goldGiftAmount),
        goldGiftNote: invitation.goldGiftNote?.trim() || null,
        note: invitation.note?.trim() || null,
        createdByUserId,
      };
    }

    if (invitation.selectedAction === 'sync' && invitation.existingInvitation) {
      return {
        mode: 'sync' as const,
        planId,
        guestId,
        groupId: invitation.resolvedGroupId,
        invitationId: invitation.existingInvitation.id,
        rsvp: invitation.rsvp,
        attendeeCount: toNonNegativeInt(invitation.attendeeCount, 1),
        moneyGiftAmount: toNullableNonNegativeInt(invitation.moneyGiftAmount),
        goldGiftAmount: toNullableNonNegativeInt(invitation.goldGiftAmount),
        goldGiftNote: invitation.goldGiftNote?.trim() || null,
        note: invitation.note?.trim() || null,
      };
    }

    return null;
  }
}
