import type { WeddingGuestGroupRepository } from '@/modules/wedding-guest/repositories/wedding-guest-group.repository';
import type {
  CreateWeddingGuestGroupInput,
  UpdateWeddingGuestGroupInput,
} from '@/modules/wedding-guest/types/wedding-guest-group';
import type { AuthUser } from '@/modules/auth/types/auth';
import { resolvePlanPermissions } from '@/modules/member/services/permission.service';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import { AppError } from '@/shared/errors/app-error';

export class WeddingGuestGroupService {
  constructor(private readonly repository: WeddingGuestGroupRepository) {}

  private assertManageWeddingGuestPermission(
    currentMember: PlanMemberDocument | null,
  ) {
    if (!resolvePlanPermissions(currentMember).canManageWeddingGuest) {
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

  async createGroup(
    plan: PlanDocument,
    input: CreateWeddingGuestGroupInput,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertManageWeddingGuestPermission(currentMember);

    const name = input.name.trim();

    if (!name) {
      throw new AppError(
        'Tên nhóm là bắt buộc.',
        'WEDDING_GUEST_GROUP_NAME_REQUIRED',
        400,
      );
    }

    return this.repository.createGroup({
      planId: plan.id,
      name,
      createdByUserId: currentUser.uid,
    });
  }

  async updateGroup(
    plan: PlanDocument,
    input: UpdateWeddingGuestGroupInput,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertManageWeddingGuestPermission(currentMember);

    const name = input.name.trim();

    if (!name) {
      throw new AppError(
        'Tên nhóm là bắt buộc.',
        'WEDDING_GUEST_GROUP_NAME_REQUIRED',
        400,
      );
    }

    await this.repository.updateGroup(plan.id, {
      groupId: input.groupId,
      name,
    });
  }

  async deleteGroup(
    plan: PlanDocument,
    groupId: string,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertManageWeddingGuestPermission(currentMember);
    await this.repository.deleteGroup(plan.id, groupId);
  }

  watchGroups(
    planId: string,
    callback: Parameters<WeddingGuestGroupRepository['watchGroups']>[1],
    onError?: (error: Error) => void,
  ) {
    return this.repository.watchGroups(planId, callback, onError);
  }
}
