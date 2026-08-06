import type { AuthUser } from '@/modules/auth/types/auth';
import type {
  AddGuestInput,
  PlanMemberDocument,
  UpdateMemberInput,
} from '@/modules/member/types/member';

export interface MemberRepository {
  watchMembers(
    planId: string,
    callback: (members: PlanMemberDocument[]) => void,
    onError?: (error: Error) => void,
  ): () => void;
  addGuest(planId: string, input: AddGuestInput, actor: AuthUser): Promise<void>;
  updateMember(planId: string, input: UpdateMemberInput, actor: AuthUser): Promise<void>;
  removeMember(planId: string, memberId: string, actor: AuthUser): Promise<void>;
  reactivateMember(planId: string, memberId: string, actor: AuthUser): Promise<void>;
  deleteMember(planId: string, memberId: string, actor: AuthUser): Promise<void>;
}
