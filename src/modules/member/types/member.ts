import type { Timestamp } from 'firebase/firestore';

export type MemberType = 'registered' | 'guest';

export type PlanRole = 'owner' | 'editor' | 'viewer';

export type PlanPermissions = {
  canEditAllExpenses: boolean;
};

export type PlanMemberStatus = 'invited' | 'active' | 'removed';

export type PlanMemberDocument = {
  id: string;
  planId: string;
  memberType: MemberType;
  userId: string | null;
  email: string | null;
  nickname: string;
  nicknameIsCustom: boolean;
  invitationId: string | null;
  avatarUrl: string | null;
  role: PlanRole;
  permissions: PlanPermissions;
  status: PlanMemberStatus;
  invitedAt: Timestamp | null;
  joinedAt: Timestamp | null;
  removedAt: Timestamp | null;
  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type ResolvedPlanPermissions = {
  canManagePlan: boolean;
  canManageMembers: boolean;
  canCreateExpense: boolean;
  canEditOwnExpense: boolean;
  canDeleteOwnExpense: boolean;
  canEditAllExpenses: boolean;
  canDeleteAllExpenses: boolean;
  canCreateIncome: boolean;
  canEditOwnIncome: boolean;
  canDeleteOwnIncome: boolean;
  canViewStatistics: boolean;
  canManageSettlements: boolean;
  canManageWeddingGuest: boolean;
};

export type AddGuestInput = {
  nickname: string;
  role: Exclude<PlanRole, 'owner'>;
};

export type UpdateMemberInput = {
  memberId: string;
  nickname: string;
  role: Exclude<PlanRole, 'owner'>;
  canEditAllExpenses: boolean;
};

export type UpdateMemberAvatarInput = {
  memberId: string;
  avatarUrl: string | null;
};
