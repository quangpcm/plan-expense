import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import type { PlanMemberDocument } from '@/modules/member/types/member';
import { resolveTodayAccessibleModules } from '@/modules/today/utils/today-summary-access';

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
    role: 'editor',
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

describe('resolveTodayAccessibleModules', () => {
  it('grants nothing for anonymous/no membership', () => {
    expect(resolveTodayAccessibleModules(null)).toEqual({
      canViewTodo: false,
      canViewTravelActivity: false,
    });
  });

  it('grants both to an owner regardless of moduleAccess overrides', () => {
    const owner = makeMember({
      role: 'owner',
      permissions: { moduleAccess: { planning: 'hidden', travelItinerary: 'hidden' } },
    });

    expect(resolveTodayAccessibleModules(owner)).toEqual({
      canViewTodo: true,
      canViewTravelActivity: true,
    });
  });

  it('grants both to an editor with default access (no overrides)', () => {
    expect(resolveTodayAccessibleModules(makeMember({ role: 'editor' }))).toEqual({
      canViewTodo: true,
      canViewTravelActivity: true,
    });
  });

  it('excludes Todo when planning module access is hidden', () => {
    const member = makeMember({
      role: 'editor',
      permissions: { moduleAccess: { planning: 'hidden' } },
    });

    expect(resolveTodayAccessibleModules(member)).toEqual({
      canViewTodo: false,
      canViewTravelActivity: true,
    });
  });

  it('excludes Travel Activity when travelItinerary module access is hidden', () => {
    const member = makeMember({
      role: 'editor',
      permissions: { moduleAccess: { travelItinerary: 'hidden' } },
    });

    expect(resolveTodayAccessibleModules(member)).toEqual({
      canViewTodo: true,
      canViewTravelActivity: false,
    });
  });

  it('still grants view-only access to a viewer with no overrides', () => {
    expect(resolveTodayAccessibleModules(makeMember({ role: 'viewer' }))).toEqual({
      canViewTodo: true,
      canViewTravelActivity: true,
    });
  });
});
