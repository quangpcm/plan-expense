import type { AuthUser } from '@/modules/auth/types/auth';
import type { CreateInvitationInput, InvitationDocument } from '@/modules/invitation/types/invitation';
import type { PlanType } from '@/modules/plan/types/plan';

export type CreateInvitationPersistenceInput = CreateInvitationInput & {
  planId: string;
  planName: string;
  planType: PlanType;
  coverImageUrl: string | null;
};

export interface InvitationRepository {
  watchInvitations(
    planId: string,
    callback: (items: InvitationDocument[]) => void,
    onError?: (error: Error) => void,
  ): () => void;
  getInvitation(planId: string, invitationId: string): Promise<InvitationDocument | null>;
  createInvitation(
    input: CreateInvitationPersistenceInput,
    actor: AuthUser,
  ): Promise<{ invitationId: string }>;
  acceptInvitation(planId: string, invitationId: string, actor: AuthUser): Promise<void>;
  revokeInvitation(planId: string, invitationId: string, actor: AuthUser): Promise<void>;
}
