import { AppError } from '@/shared/errors/app-error';
import type { AuthUser } from '@/modules/auth/types/auth';
import type { MemberRepository } from '@/modules/member/repositories/member.repository';
import type {
  AddGuestInput,
  PlanMemberDocument,
  UpdateMemberAvatarInput,
  UpdateMemberInput,
} from '@/modules/member/types/member';
import { hasPlanCapability } from '@/modules/member/services/permission.service';

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
    if (!hasPlanCapability(currentMember, 'members.manage')) {
      throw new AppError('You do not have permission to add members.', 'MEMBER_PERMISSION_DENIED', 403);
    }

    return this.memberRepository.addGuest(planId, input, actor);
  }

  async updateMember(
    planId: string,
    input: UpdateMemberInput,
    actor: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    if (!hasPlanCapability(currentMember, 'members.manage')) {
      throw new AppError('You do not have permission to edit members.', 'MEMBER_PERMISSION_DENIED', 403);
    }

    await this.memberRepository.updateMember(planId, input, actor);
  }

  async updateMemberAvatar(
    planId: string,
    input: UpdateMemberAvatarInput,
    actor: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    if (!hasPlanCapability(currentMember, 'members.manage')) {
      throw new AppError('You do not have permission to edit members.', 'MEMBER_PERMISSION_DENIED', 403);
    }

    await this.memberRepository.updateMemberAvatar(planId, input, actor);
  }

  async removeMember(
    planId: string,
    member: PlanMemberDocument,
    actor: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    if (!hasPlanCapability(currentMember, 'members.manage')) {
      throw new AppError('You do not have permission to remove members.', 'MEMBER_PERMISSION_DENIED', 403);
    }

    if (member.role === 'owner') {
      throw new AppError('Owner cannot be removed before ownership transfer.', 'OWNER_REMOVE_BLOCKED', 400);
    }

    await this.memberRepository.removeMember(planId, member.id, actor);
  }

  async reactivateMember(
    planId: string,
    member: PlanMemberDocument,
    actor: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    if (!hasPlanCapability(currentMember, 'members.manage')) {
      throw new AppError('You do not have permission to reactivate members.', 'MEMBER_PERMISSION_DENIED', 403);
    }

    await this.memberRepository.reactivateMember(planId, member.id, actor);
  }

  async deleteMember(
    planId: string,
    member: PlanMemberDocument,
    actor: AuthUser,
    currentMember: PlanMemberDocument | null,
    options: { hasLinkedRecords: boolean },
  ) {
    if (!hasPlanCapability(currentMember, 'members.manage')) {
      throw new AppError('You do not have permission to delete members.', 'MEMBER_PERMISSION_DENIED', 403);
    }

    if (member.role === 'owner') {
      throw new AppError('Owner cannot be deleted.', 'OWNER_DELETE_BLOCKED', 400);
    }

    if (options.hasLinkedRecords) {
      throw new AppError(
        'This member already has related expense, income, or settlement records. Deactivate instead of deleting to keep history intact.',
        'MEMBER_HAS_LINKED_RECORDS',
        400,
      );
    }

    await this.memberRepository.deleteMember(planId, member.id, actor);
  }

  async cascadeNicknameUpdate(userId: string, nickname: string) {
    await this.memberRepository.cascadeNicknameUpdate(userId, nickname);
  }

  async unlinkMemberAccount(
    planId: string,
    member: PlanMemberDocument,
    currentMember: PlanMemberDocument | null,
  ) {
    if (!hasPlanCapability(currentMember, 'members.manage')) {
      throw new AppError('You do not have permission to unlink member accounts.', 'MEMBER_PERMISSION_DENIED', 403);
    }

    if (member.role === 'owner') {
      throw new AppError('Owner account cannot be unlinked.', 'OWNER_UNLINK_BLOCKED', 400);
    }

    await this.memberRepository.unlinkMemberAccount(planId, member.id);
  }
}
