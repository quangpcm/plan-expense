import type { AuthUser } from '@/modules/auth/types/auth';
import type {
  AddGuestInput,
  PlanMemberDocument,
  UpdateMemberRoleInput,
} from '@/modules/member/types/member';

export interface MemberRepository {
  watchMembers(planId: string, callback: (members: PlanMemberDocument[]) => void): () => void;
  addGuest(planId: string, input: AddGuestInput, actor: AuthUser): Promise<void>;
  updateMemberRole(
    planId: string,
    input: UpdateMemberRoleInput,
    actor: AuthUser,
  ): Promise<void>;
  removeMember(planId: string, memberId: string, actor: AuthUser): Promise<void>;
}

