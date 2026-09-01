import type { WeddingGuestRepository } from '@/modules/wedding-guest/repositories/wedding-guest.repository';
import type {
  CreateWeddingGuestInput,
  UpdateWeddingGuestInput,
} from '@/modules/wedding-guest/types/wedding-guest';
import { normalizeVietnameseName } from '@/modules/wedding-guest/utils/normalize-name';
import type { AuthUser } from '@/modules/auth/types/auth';
import { hasPlanCapability } from '@/modules/member/services/permission.service';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import { AppError } from '@/shared/errors/app-error';

function toNonNegativeInt(value: number | undefined, fallback: number) {
  if (value === undefined || !Number.isFinite(value) || value < 0) {
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

export class WeddingGuestService {
  constructor(private readonly repository: WeddingGuestRepository) {}

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

  async createGuest(
    plan: PlanDocument,
    input: CreateWeddingGuestInput,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertManageWeddingGuestPermission(currentMember);

    const name = input.name.trim();

    if (!name) {
      throw new AppError(
        'Tên khách là bắt buộc.',
        'WEDDING_GUEST_NAME_REQUIRED',
        400,
      );
    }

    if (!input.groupId) {
      throw new AppError(
        'Vui lòng chọn nhóm cho khách này.',
        'WEDDING_GUEST_GROUP_REQUIRED',
        400,
      );
    }

    return this.repository.createGuestWithInvitation({
      planId: plan.id,
      name,
      normalizedName: normalizeVietnameseName(name),
      sideId: input.sideId,
      relationshipId: input.relationshipId,
      invitedById: input.invitedById,
      groupId: input.groupId,
      rsvp: input.rsvp ?? 'pending',
      attendeeCount: toNonNegativeInt(input.attendeeCount, 1),
      moneyGiftAmount: toNullableNonNegativeInt(input.moneyGiftAmount),
      goldGiftAmount: toNullableNonNegativeInt(input.goldGiftAmount),
      goldGiftNote: input.goldGiftNote?.trim() || null,
      note: input.note?.trim() || null,
      transportArrangement: input.transportArrangement ?? 'undecided',
      createdByUserId: currentUser.uid,
    });
  }

  async updateGuest(
    plan: PlanDocument,
    input: UpdateWeddingGuestInput,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertManageWeddingGuestPermission(currentMember);

    const name = input.name.trim();

    if (!name) {
      throw new AppError(
        'Tên khách là bắt buộc.',
        'WEDDING_GUEST_NAME_REQUIRED',
        400,
      );
    }

    await this.repository.updateGuest(plan.id, {
      guestId: input.guestId,
      name,
      normalizedName: normalizeVietnameseName(name),
      sideId: input.sideId,
      relationshipId: input.relationshipId,
      invitedById: input.invitedById,
    });
  }

  async deleteGuest(
    plan: PlanDocument,
    guestId: string,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertManageWeddingGuestPermission(currentMember);
    await this.repository.deleteGuest(plan.id, guestId);
  }

  watchGuests(
    planId: string,
    callback: Parameters<WeddingGuestRepository['watchGuests']>[1],
    onError?: (error: Error) => void,
  ) {
    return this.repository.watchGuests(planId, callback, onError);
  }
}
