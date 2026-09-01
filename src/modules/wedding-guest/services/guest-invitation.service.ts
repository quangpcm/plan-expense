import type { GuestInvitationRepository } from '@/modules/wedding-guest/repositories/guest-invitation.repository';
import type {
  AddGuestInvitationInput,
  UpdateGuestInvitationInput,
} from '@/modules/wedding-guest/types/guest-invitation';
import type { AuthUser } from '@/modules/auth/types/auth';
import { hasPlanCapability } from '@/modules/member/services/permission.service';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import { AppError } from '@/shared/errors/app-error';

function toNonNegativeInt(value: number, fallback: number) {
  if (!Number.isFinite(value) || value < 0) {
    return fallback;
  }

  return Math.trunc(value);
}

function toNullableNonNegativeInt(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.trunc(value);
}

export class GuestInvitationService {
  constructor(private readonly repository: GuestInvitationRepository) {}

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

  async addInvitation(
    plan: PlanDocument,
    input: AddGuestInvitationInput,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertManageWeddingGuestPermission(currentMember);

    return this.repository.addInvitation({
      planId: plan.id,
      guestId: input.guestId,
      groupId: input.groupId,
      rsvp: input.rsvp,
      attendeeCount: toNonNegativeInt(input.attendeeCount, 1),
      moneyGiftAmount: toNullableNonNegativeInt(input.moneyGiftAmount),
      goldGiftAmount: toNullableNonNegativeInt(input.goldGiftAmount),
      goldGiftNote: input.goldGiftNote?.trim() || null,
      note: input.note?.trim() || null,
      transportArrangement: input.transportArrangement ?? 'undecided',
      createdByUserId: currentUser.uid,
    });
  }

  async updateInvitation(
    plan: PlanDocument,
    input: UpdateGuestInvitationInput,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertManageWeddingGuestPermission(currentMember);

    await this.repository.updateInvitation(plan.id, {
      invitationId: input.invitationId,
      rsvp: input.rsvp,
      attendeeCount: toNonNegativeInt(input.attendeeCount, 1),
      moneyGiftAmount: toNullableNonNegativeInt(input.moneyGiftAmount),
      goldGiftAmount: toNullableNonNegativeInt(input.goldGiftAmount),
      goldGiftNote: input.goldGiftNote?.trim() || null,
      note: input.note?.trim() || null,
      transportArrangement: input.transportArrangement ?? 'undecided',
    });
  }

  async deleteInvitation(
    plan: PlanDocument,
    invitationId: string,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertManageWeddingGuestPermission(currentMember);
    await this.repository.deleteInvitation(plan.id, invitationId);
  }

  watchInvitations(
    planId: string,
    callback: Parameters<GuestInvitationRepository['watchInvitations']>[1],
    onError?: (error: Error) => void,
  ) {
    return this.repository.watchInvitations(planId, callback, onError);
  }
}
