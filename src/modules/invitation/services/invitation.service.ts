import { AppError } from '@/shared/errors/app-error';
import type { AuthUser } from '@/modules/auth/types/auth';
import type { InvitationRepository } from '@/modules/invitation/repositories/invitation.repository';
import type {
  CreateInvitationInput,
  InvitationDocument,
} from '@/modules/invitation/types/invitation';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { resolvePlanPermissions } from '@/modules/member/services/permission.service';

export class InvitationService {
  constructor(private readonly invitationRepository: InvitationRepository) {}

  watchInvitations(planId: string, callback: (items: InvitationDocument[]) => void) {
    return this.invitationRepository.watchInvitations(planId, callback);
  }

  async createInvitation(
    planId: string,
    input: CreateInvitationInput,
    actor: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    if (!resolvePlanPermissions(currentMember).canManageMembers) {
      throw new AppError(
        'You do not have permission to send invitations.',
        'INVITATION_PERMISSION_DENIED',
        403,
      );
    }

    await this.invitationRepository.createInvitation(planId, input, actor);
  }
}

