import { AppError } from '@/shared/errors/app-error';
import type { AuthUser } from '@/modules/auth/types/auth';
import type { InvitationRepository } from '@/modules/invitation/repositories/invitation.repository';
import type {
  CreateInvitationInput,
  InvitationDocument,
} from '@/modules/invitation/types/invitation';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { hasPlanCapability } from '@/modules/member/services/permission.service';
import type { PlanDocument } from '@/modules/plan/types/plan';

export class InvitationService {
  constructor(private readonly invitationRepository: InvitationRepository) {}

  watchInvitations(planId: string, callback: (items: InvitationDocument[]) => void, onError?: (error: Error) => void) {
    return this.invitationRepository.watchInvitations(planId, callback, onError);
  }

  async getInvitation(planId: string, invitationId: string) {
    return this.invitationRepository.getInvitation(planId, invitationId);
  }

  async createInvitation(
    plan: PlanDocument,
    input: CreateInvitationInput,
    actor: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    if (!hasPlanCapability(currentMember, 'members.manage')) {
      throw new AppError(
        'You do not have permission to send invitations.',
        'INVITATION_PERMISSION_DENIED',
        403,
      );
    }

    return this.invitationRepository.createInvitation(
      {
        planId: plan.id,
        planName: plan.name,
        planType: plan.planType,
        coverImageUrl: plan.coverImageUrl,
        email: input.email ? input.email.trim() : null,
        role: input.role,
      },
      actor,
    );
  }

  async createClaimInvitation(
    plan: PlanDocument,
    targetMember: PlanMemberDocument,
    email: string | null,
    actor: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    if (!hasPlanCapability(currentMember, 'members.manage')) {
      throw new AppError(
        'You do not have permission to send invitations.',
        'INVITATION_PERMISSION_DENIED',
        403,
      );
    }

    if (targetMember.memberType !== 'guest' || targetMember.status !== 'active' || targetMember.role === 'owner') {
      throw new AppError(
        'Only an active guest can be linked to an account.',
        'INVITATION_INVALID_TARGET',
        400,
      );
    }

    return this.invitationRepository.createInvitation(
      {
        planId: plan.id,
        planName: plan.name,
        planType: plan.planType,
        coverImageUrl: plan.coverImageUrl,
        email: email ? email.trim() : null,
        role: targetMember.role,
        targetMemberId: targetMember.id,
        targetNickname: targetMember.nickname,
      },
      actor,
    );
  }

  async acceptInvitation(planId: string, invitationId: string, actor: AuthUser) {
    const invitation = await this.invitationRepository.getInvitation(planId, invitationId);

    if (!invitation) {
      throw new AppError('This invitation could not be found.', 'INVITATION_NOT_FOUND', 404);
    }

    if (invitation.status !== 'pending') {
      throw new AppError(
        `This invitation is no longer available (${invitation.status}).`,
        'INVITATION_NOT_PENDING',
        400,
      );
    }

    if (invitation.expiresAt.toMillis() < Date.now()) {
      throw new AppError('This invitation has expired.', 'INVITATION_EXPIRED', 400);
    }

    if (invitation.email && invitation.email !== actor.email?.toLowerCase()) {
      throw new AppError(
        `This invitation can only be accepted by ${invitation.email}.`,
        'INVITATION_EMAIL_MISMATCH',
        403,
      );
    }

    await this.invitationRepository.acceptInvitation(planId, invitationId, actor);
  }

  async revokeInvitation(
    planId: string,
    invitationId: string,
    actor: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    if (!hasPlanCapability(currentMember, 'members.manage')) {
      throw new AppError(
        'You do not have permission to revoke invitations.',
        'INVITATION_PERMISSION_DENIED',
        403,
      );
    }

    await this.invitationRepository.revokeInvitation(planId, invitationId, actor);
  }
}
