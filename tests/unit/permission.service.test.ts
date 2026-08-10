import { describe, expect, it } from 'vitest';

import { resolvePlanPermissions } from '@/modules/member/services/permission.service';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { Timestamp } from 'firebase/firestore';

function makeMember(overrides: Partial<PlanMemberDocument>): PlanMemberDocument {
  return {
    id: 'member-1',
    planId: 'plan-1',
    memberType: 'registered',
    userId: 'user-1',
    email: 'user@example.com',
    nickname: 'Member',
    nicknameIsCustom: false,
    avatarUrl: null,
    role: 'viewer',
    permissions: {
      canEditAllExpenses: false,
    },
    status: 'active',
    invitedAt: null,
    joinedAt: Timestamp.now(),
    removedAt: null,
    createdByUserId: 'user-1',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

describe('resolvePlanPermissions', () => {
  it('returns locked permissions for anonymous membership', () => {
    expect(resolvePlanPermissions(null)).toMatchObject({
      canManagePlan: false,
      canCreateExpense: false,
      canManageSettlements: false,
    });
  });

  it('grants owner all management permissions', () => {
    expect(resolvePlanPermissions(makeMember({ role: 'owner' }))).toMatchObject({
      canManagePlan: true,
      canManageMembers: true,
      canCreateExpense: true,
      canDeleteAllExpenses: true,
      canManageSettlements: true,
    });
  });

  it('lets editor create but not manage everything by default', () => {
    expect(resolvePlanPermissions(makeMember({ role: 'editor' }))).toMatchObject({
      canCreateExpense: true,
      canDeleteAllExpenses: false,
      canManageSettlements: false,
    });
  });

  it('honors canEditAllExpenses override for non-owner members', () => {
    expect(
      resolvePlanPermissions(
        makeMember({
          role: 'viewer',
          permissions: {
            canEditAllExpenses: true,
          },
        }),
      ),
    ).toMatchObject({
      canEditAllExpenses: true,
      canDeleteAllExpenses: false,
      canCreateExpense: false,
    });
  });
});
