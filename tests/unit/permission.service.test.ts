import { describe, expect, it } from 'vitest';

import { hasPlanCapability, resolveModuleAccess, resolvePlanPermissions } from '@/modules/member/services/permission.service';
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
    invitationId: null,
    avatarUrl: null,
    role: 'viewer',
    permissions: {
      moduleAccess: {},
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

  it('lets editor create but not manage everything by default (finance/planning default to manage_own)', () => {
    expect(resolvePlanPermissions(makeMember({ role: 'editor' }))).toMatchObject({
      canManagePlan: false,
      canCreateExpense: true,
      canDeleteAllExpenses: false,
      canManageSettlements: false,
    });
  });

  it('grants canManagePlan (editAllMilestone) once an editor is explicitly given planning=manage_all', () => {
    expect(
      resolvePlanPermissions(
        makeMember({
          role: 'editor',
          permissions: { moduleAccess: { planning: 'manage_all' } },
        }),
      ),
    ).toMatchObject({
      canManagePlan: true,
    });
  });

  it('grants full finance access once an editor is explicitly given finance=manage_all', () => {
    expect(
      resolvePlanPermissions(
        makeMember({
          role: 'editor',
          permissions: { moduleAccess: { finance: 'manage_all' } },
        }),
      ),
    ).toMatchObject({
      canCreateExpense: true,
      canEditAllExpenses: true,
      canDeleteAllExpenses: true,
      // Settlement never rides along with finance=manage_all (docs/roles-permissions.md #12).
      canManageSettlements: false,
    });
  });

  it('P3: viewer never gets write capability, even with a stored manage_all override', () => {
    expect(
      resolvePlanPermissions(
        makeMember({
          role: 'viewer',
          permissions: { moduleAccess: { finance: 'manage_all' } },
        }),
      ),
    ).toMatchObject({
      canCreateExpense: false,
      canEditAllExpenses: false,
      canDeleteAllExpenses: false,
    });
  });
});

describe('planning capabilities (Công việc = Milestone + Todo, docs/roles-permissions.md #13 amended)', () => {
  it('planning=manage_own grants create/edit-own/delete-own for both Todo and Milestone', () => {
    const editor = makeMember({ role: 'editor', permissions: { moduleAccess: { planning: 'manage_own' } } });

    expect(hasPlanCapability(editor, 'planning.createTodo')).toBe(true);
    expect(hasPlanCapability(editor, 'planning.editOwnTodo')).toBe(true);
    expect(hasPlanCapability(editor, 'planning.deleteOwnTodo')).toBe(true);
    expect(hasPlanCapability(editor, 'planning.createMilestone')).toBe(true);
    expect(hasPlanCapability(editor, 'planning.editOwnMilestone')).toBe(true);
    expect(hasPlanCapability(editor, 'planning.deleteOwnMilestone')).toBe(true);

    expect(hasPlanCapability(editor, 'planning.editAllTodo')).toBe(false);
    expect(hasPlanCapability(editor, 'planning.editAllMilestone')).toBe(false);
    expect(hasPlanCapability(editor, 'planning.deleteAllMilestone')).toBe(false);
  });

  it('planning=manage_all additionally grants edit-all/delete-all for both Todo and Milestone', () => {
    const editor = makeMember({ role: 'editor', permissions: { moduleAccess: { planning: 'manage_all' } } });

    expect(hasPlanCapability(editor, 'planning.editAllTodo')).toBe(true);
    expect(hasPlanCapability(editor, 'planning.deleteAllTodo')).toBe(true);
    expect(hasPlanCapability(editor, 'planning.editAllMilestone')).toBe(true);
    expect(hasPlanCapability(editor, 'planning.deleteAllMilestone')).toBe(true);
    // manage_all subsumes manage_own.
    expect(hasPlanCapability(editor, 'planning.createMilestone')).toBe(true);
  });
});

describe('resolveModuleAccess', () => {
  it('resolves hidden for no member', () => {
    expect(resolveModuleAccess(null, 'finance')).toBe('hidden');
  });

  it('always resolves manage_all for owner, ignoring any stored override', () => {
    expect(
      resolveModuleAccess(makeMember({ role: 'owner', permissions: { moduleAccess: { finance: 'view' } } }), 'finance'),
    ).toBe('manage_all');
  });

  it('defaults editor finance/planning to manage_own', () => {
    const editor = makeMember({ role: 'editor' });
    expect(resolveModuleAccess(editor, 'finance')).toBe('manage_own');
    expect(resolveModuleAccess(editor, 'planning')).toBe('manage_own');
  });

  it('defaults editor weddingGuests/travelItinerary to manage_all (matches pre-V2 behavior)', () => {
    const editor = makeMember({ role: 'editor' });
    expect(resolveModuleAccess(editor, 'weddingGuests')).toBe('manage_all');
    expect(resolveModuleAccess(editor, 'travelItinerary')).toBe('manage_all');
  });

  it('lets owner downgrade an editor module override to hidden', () => {
    const editor = makeMember({ role: 'editor', permissions: { moduleAccess: { finance: 'hidden' } } });
    expect(resolveModuleAccess(editor, 'finance')).toBe('hidden');
  });

  it('clamps a viewer override down to view unless explicitly hidden', () => {
    const viewer = makeMember({ role: 'viewer', permissions: { moduleAccess: { finance: 'manage_own' } } });
    expect(resolveModuleAccess(viewer, 'finance')).toBe('view');

    const hiddenViewer = makeMember({ role: 'viewer', permissions: { moduleAccess: { finance: 'hidden' } } });
    expect(resolveModuleAccess(hiddenViewer, 'finance')).toBe('hidden');
  });
});
