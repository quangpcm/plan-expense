import type { AuthUser } from '@/modules/auth/types/auth';
import type {
  AddGuestInput,
  PlanMemberDocument,
  UpdateMemberAvatarInput,
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
  updateMemberAvatar(planId: string, input: UpdateMemberAvatarInput, actor: AuthUser): Promise<void>;
  removeMember(planId: string, memberId: string, actor: AuthUser): Promise<void>;
  reactivateMember(planId: string, memberId: string, actor: AuthUser): Promise<void>;
  deleteMember(planId: string, memberId: string, actor: AuthUser): Promise<void>;
  cascadeNicknameUpdate(userId: string, nickname: string): Promise<void>;
  unlinkMemberAccount(planId: string, memberId: string): Promise<void>;
}
