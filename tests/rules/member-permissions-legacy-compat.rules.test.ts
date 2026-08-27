import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, describe, it } from 'vitest';

// Regression coverage for the "owner can't add a Todo on some old plans"
// investigation (root cause confirmed via direct inspection of the real
// production document — see conversation history, not reproducible from
// source alone).
// Root cause: memberModuleAccess() dot-accessed
// `memberDoc(...).data.permissions.moduleAccess` directly. Some member docs
// predate the moduleAccess permission redesign and still carry the older
// permissions shape (e.g. `{ canEditAllExpenses: true }`, no `moduleAccess`
// key at all — real example found on a production owner member doc).
// Firestore rules throw an evaluation error the moment a dot-accessed key is
// missing, and — because `let overrides = ...` is evaluated eagerly, before
// the surrounding ternary can short-circuit around it — this crashed
// memberModuleAccess() (and therefore every canManage*() check built on it:
// planning, finance, wedding guests, travel activities) for that member,
// including the `role == 'owner'` branch that should have trivially granted
// 'manage_all' regardless of any stored override. Fixed by treating a
// missing permissions/moduleAccess key as "no overrides" (an empty map)
// instead of erroring.
const projectId = 'demo-member-permissions-legacy-compat';
let testEnv: RulesTestEnvironment;
const now = new Date('2026-08-05T10:00:00.000Z');

type PermissionsShape = 'modern-empty' | 'legacy-no-module-access' | 'legacy-no-permissions-at-all';

function permissionsFor(shape: PermissionsShape): Record<string, unknown> | undefined {
  if (shape === 'modern-empty') {
    return { moduleAccess: {} };
  }
  if (shape === 'legacy-no-module-access') {
    // Real shape found on a production owner member doc — predates the
    // moduleAccess redesign, no backfill was ever run for it.
    return { canEditAllExpenses: true };
  }
  return undefined; // 'legacy-no-permissions-at-all' — key omitted entirely.
}

async function seed(ownerPermissionsShape: PermissionsShape, editorPermissionsShape: PermissionsShape) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, 'plans', 'plan-1'), {
      id: 'plan-1',
      name: 'Wedding',
      description: null,
      planType: 'wedding',
      ownerUserId: 'owner-user',
      ownerMemberId: 'member-owner',
      currency: 'VND',
      timezone: 'Asia/Ho_Chi_Minh',
      coverImageUrl: null,
      coverImageStoragePath: null,
      startDate: null,
      endDate: null,
      status: 'active',
      memberCount: 2,
      milestoneCount: 1,
      todoCount: 0,
      expenseCount: 0,
      incomeCount: 0,
      settlementCount: 0,
      estimatedAmount: 0,
      totalExpense: 0,
      totalIncome: 0,
      createdAt: now,
      updatedAt: now,
      closedAt: null,
      archivedAt: null,
    });

    const ownerMember: Record<string, unknown> = {
      id: 'member-owner',
      planId: 'plan-1',
      memberType: 'registered',
      userId: 'owner-user',
      email: 'owner@example.com',
      nickname: 'Owner',
      nicknameIsCustom: false,
      invitationId: null,
      avatarUrl: null,
      role: 'owner',
      status: 'active',
      invitedAt: null,
      joinedAt: now,
      removedAt: null,
      createdByUserId: 'owner-user',
      createdAt: now,
      updatedAt: now,
    };
    const ownerPermissions = permissionsFor(ownerPermissionsShape);
    if (ownerPermissions !== undefined) {
      ownerMember.permissions = ownerPermissions;
    }
    await setDoc(doc(db, 'plans', 'plan-1', 'members', 'member-owner'), ownerMember);

    const editorMember: Record<string, unknown> = {
      id: 'member-editor',
      planId: 'plan-1',
      memberType: 'registered',
      userId: 'editor-user',
      email: 'editor@example.com',
      nickname: 'Editor',
      nicknameIsCustom: false,
      invitationId: null,
      avatarUrl: null,
      role: 'editor',
      status: 'active',
      invitedAt: null,
      joinedAt: now,
      removedAt: null,
      createdByUserId: 'owner-user',
      createdAt: now,
      updatedAt: now,
    };
    const editorPermissions = permissionsFor(editorPermissionsShape);
    if (editorPermissions !== undefined) {
      editorMember.permissions = editorPermissions;
    }
    await setDoc(doc(db, 'plans', 'plan-1', 'members', 'member-editor'), editorMember);

    await setDoc(doc(db, 'userPlans', 'owner-user', 'plans', 'plan-1'), {
      id: 'plan-1',
      planId: 'plan-1',
      userId: 'owner-user',
      planName: 'Wedding',
      planType: 'wedding',
      role: 'owner',
      memberId: 'member-owner',
      memberStatus: 'active',
      planStatus: 'active',
      coverImageUrl: null,
      estimatedAmount: 0,
      totalExpense: 0,
      memberCount: 2,
      joinedAt: now,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(doc(db, 'userPlans', 'editor-user', 'plans', 'plan-1'), {
      id: 'plan-1',
      planId: 'plan-1',
      userId: 'editor-user',
      planName: 'Wedding',
      planType: 'wedding',
      role: 'editor',
      memberId: 'member-editor',
      memberStatus: 'active',
      planStatus: 'active',
      coverImageUrl: null,
      estimatedAmount: 0,
      totalExpense: 0,
      memberCount: 2,
      joinedAt: now,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(doc(db, 'plans', 'plan-1', 'milestones', 'milestone-1'), {
      id: 'milestone-1',
      planId: 'plan-1',
      title: 'Le dinh hon',
      description: null,
      startDate: null,
      endDate: null,
      orderIndex: 0,
      todoCount: 0,
      completedTodoCount: 0,
      estimatedAmount: 0,
      totalExpense: 0,
      status: 'in_progress',
      isSystemHidden: false,
      createdByUserId: 'owner-user',
      createdAt: now,
      updatedAt: now,
    });
  });
}

describe('member permissions legacy compatibility (permissions.moduleAccess absent)', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId,
      firestore: { rules: readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8') },
    });
  });

  afterAll(async () => {
    if (testEnv) await testEnv.cleanup();
  });

  function ownerDb() {
    return testEnv.authenticatedContext('owner-user').firestore();
  }

  function editorDb() {
    return testEnv.authenticatedContext('editor-user').firestore();
  }

  type TestFirestore = ReturnType<typeof ownerDb>;

  function createTodoAs(db: TestFirestore, id: string, userId: string) {
    return setDoc(doc(db, 'plans', 'plan-1', 'todos', id), {
      id,
      planId: 'plan-1',
      milestoneId: 'milestone-1',
      orderIndex: 1000,
      title: 'New todo',
      description: null,
      assigneeMemberId: null,
      dueDate: null,
      priority: 'medium',
      status: 'todo',
      budget: null,
      vendors: [],
      selectedTodoVendorId: null,
      attachments: [],
      createdByUserId: userId,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      cancelledAt: null,
    });
  }

  function createExpenseAs(db: TestFirestore, id: string, userId: string, memberId: string) {
    return setDoc(doc(db, 'plans', 'plan-1', 'expenses', id), {
      id,
      planId: 'plan-1',
      milestoneId: 'milestone-1',
      title: 'Snack',
      categoryId: null,
      amount: 100,
      currency: 'VND',
      paymentSourceType: 'member',
      paidByMemberId: memberId,
      participants: [],
      status: 'active',
      createdByUserId: userId,
      createdByMemberId: memberId,
      createdAt: now,
      updatedAt: now,
    });
  }

  // The milestone `update` rule never grants owners a role-based escape
  // hatch the way `delete` does via isPlanOwner() — it goes through
  // canManageOwnPlanning()/canManageAllPlanning() unconditionally, so it's a
  // valid probe of the memberModuleAccess() crash too.
  function updateOwnMilestone(db: TestFirestore) {
    return updateDoc(doc(db, 'plans', 'plan-1', 'milestones', 'milestone-1'), {
      orderIndex: 1,
      updatedAt: now,
    });
  }

  describe('owner with legacy permissions shape (no moduleAccess key at all)', () => {
    it('owner can still create a Todo — the exact real-world reported bug', async () => {
      await testEnv.clearFirestore();
      await seed('legacy-no-module-access', 'modern-empty');
      await assertSucceeds(createTodoAs(ownerDb(), 'todo-1', 'owner-user'));
    });

    it('owner can still create an Expense (a different canManage*() path through the same function)', async () => {
      await testEnv.clearFirestore();
      await seed('legacy-no-module-access', 'modern-empty');
      await assertSucceeds(createExpenseAs(ownerDb(), 'expense-1', 'owner-user', 'member-owner'));
    });

    it('owner can still update their own milestone', async () => {
      await testEnv.clearFirestore();
      await seed('legacy-no-module-access', 'modern-empty');
      await assertSucceeds(updateOwnMilestone(ownerDb()));
    });
  });

  describe('owner with `permissions` field entirely absent', () => {
    it('owner can still create a Todo', async () => {
      await testEnv.clearFirestore();
      await seed('legacy-no-permissions-at-all', 'modern-empty');
      await assertSucceeds(createTodoAs(ownerDb(), 'todo-1', 'owner-user'));
    });
  });

  describe('editor with legacy permissions shape falls back to the role default, not a crash', () => {
    it('editor (default manage_own for planning) can create a Todo', async () => {
      await testEnv.clearFirestore();
      await seed('modern-empty', 'legacy-no-module-access');
      await assertSucceeds(createTodoAs(editorDb(), 'todo-2', 'editor-user'));
    });
  });

  describe('viewer never gains write capability even with a legacy/absent permissions shape', () => {
    it('a viewer with no permissions field at all still cannot create a Todo', async () => {
      await testEnv.clearFirestore();
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await setDoc(doc(db, 'plans', 'plan-1', 'members', 'member-viewer'), {
          id: 'member-viewer',
          planId: 'plan-1',
          memberType: 'registered',
          userId: 'viewer-user',
          email: 'viewer@example.com',
          nickname: 'Viewer',
          nicknameIsCustom: false,
          invitationId: null,
          avatarUrl: null,
          role: 'viewer',
          status: 'active',
          invitedAt: null,
          joinedAt: now,
          removedAt: null,
          createdByUserId: 'owner-user',
          createdAt: now,
          updatedAt: now,
        });
        await setDoc(doc(db, 'userPlans', 'viewer-user', 'plans', 'plan-1'), {
          id: 'plan-1',
          planId: 'plan-1',
          userId: 'viewer-user',
          planName: 'Wedding',
          planType: 'wedding',
          role: 'viewer',
          memberId: 'member-viewer',
          memberStatus: 'active',
          planStatus: 'active',
          coverImageUrl: null,
          estimatedAmount: 0,
          totalExpense: 0,
          memberCount: 3,
          joinedAt: now,
          lastActivityAt: now,
          createdAt: now,
          updatedAt: now,
        });
      });
      await seed('modern-empty', 'modern-empty');
      const viewerDb = testEnv.authenticatedContext('viewer-user').firestore();
      await assertFails(createTodoAs(viewerDb, 'todo-3', 'viewer-user'));
    });
  });
});
