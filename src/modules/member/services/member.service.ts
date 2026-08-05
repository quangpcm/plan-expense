import { AppError } from '@/shared/errors/app-error';
import type { AuthUser } from '@/modules/auth/types/auth';
import type { MemberRepository } from '@/modules/member/repositories/member.repository';
import type {
  AddGuestInput,
  PlanMemberDocument,
  UpdateMemberRoleInput,
} from '@/modules/member/types/member';
import { resolvePlanPermissions } from '@/modules/member/services/permission.service';

export class MemberService {
  constructor(private readonly memberRepository: MemberRepository) {}

  watchMembers(planId: string, callback: (members: PlanMemberDocument[]) => void, onError?: (error: Error) => void) {
    return this.memberRepository.watchMembers(planId, callback, onError);
  }

  async addGuest(
    planId: string,
    input: AddGuestInput,
    actor: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    if (!resolvePlanPermissions(currentMember).canManageMembers) {
      throw new AppError('You do not have permission to add members.', 'MEMBER_PERMISSION_DENIED', 403);
    }

    await this.memberRepository.addGuest(planId, input, actor);
  }

  async updateMemberRole(
    planId: string,
    input: UpdateMemberRoleInput,
    actor: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    if (!resolvePlanPermissions(currentMember).canManageMembers) {
      throw new AppError('You do not have permission to edit members.', 'MEMBER_PERMISSION_DENIED', 403);
    }

    await this.memberRepository.updateMemberRole(planId, input, actor);
  }

  async removeMember(
    planId: string,
    member: PlanMemberDocument,
    actor: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    if (!resolvePlanPermissions(currentMember).canManageMembers) {
      throw new AppError('You do not have permission to remove members.', 'MEMBER_PERMISSION_DENIED', 403);
    }

    if (member.role === 'owner') {
      throw new AppError('Owner cannot be removed before ownership transfer.', 'OWNER_REMOVE_BLOCKED', 400);
    }

    await this.memberRepository.removeMember(planId, member.id, actor);
  }
}
