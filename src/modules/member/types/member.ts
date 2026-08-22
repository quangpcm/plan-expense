import type { Timestamp } from 'firebase/firestore';

import type { ConfigurableModuleId, ModuleAccessLevel } from '@/modules/plan/types/plan-modular';

export type MemberType = 'registered' | 'guest';

export type PlanRole = 'owner' | 'editor' | 'viewer';

// Roles & Permissions V2 (docs/roles-permissions.md). Module không có entry
// ở đây resolve theo role default (permission.service.ts) — chỉ lưu override.
export type PlanPermissions = {
  moduleAccess?: Partial<Record<ConfigurableModuleId, ModuleAccessLevel>>;
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

export type AddGuestInput = {
  nickname: string;
  role: Exclude<PlanRole, 'owner'>;
};

export type UpdateMemberInput = {
  memberId: string;
  nickname: string;
  role: Exclude<PlanRole, 'owner'>;
  moduleAccess: Partial<Record<ConfigurableModuleId, ModuleAccessLevel>>;
};

export type UpdateMemberAvatarInput = {
  memberId: string;
  avatarUrl: string | null;
};
