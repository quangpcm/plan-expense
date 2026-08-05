import type { AuthUser } from '@/modules/auth/types/auth';
import type {
  CreateInvitationInput,
  InvitationDocument,
} from '@/modules/invitation/types/invitation';

export interface InvitationRepository {
  watchInvitations(planId: string, callback: (items: InvitationDocument[]) => void): () => void;
  createInvitation(planId: string, input: CreateInvitationInput, actor: AuthUser): Promise<void>;
}

