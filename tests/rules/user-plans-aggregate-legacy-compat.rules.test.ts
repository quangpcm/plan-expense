import { readFileSync } from 'node:fs';
import path from 'node:path';

import { assertFails, assertSucceeds, type RulesTestEnvironment, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, describe, it } from 'vitest';

// Regression coverage for the "milestone delete shows 'Missing or insufficient
// permissions' even though the delete itself succeeded" investigation.
// Root cause: MilestoneService.deleteMilestone()'s syncUserPlansAggregate()
// call batch-updates every plan member's userPlans mirror doc with only
// milestone/todo counter fields (milestoneCount, todoCount, ...) — it never
// touches totalExpense or memberCount. The write is a plain batch.update()
// (merge), so request.resource.data for those two untouched fields just
// reflects whatever the target member's existing doc already had. The "any
// active member" update branch required `totalExpense is int` /
// `memberCount is int` unconditionally, so any plan with one legacy
// userPlans doc predating those fields made the whole atomic batch fail with
// permission-denied — after the milestone/todos were already durably
// deleted. Fixed by applying the same conditional-type-check pattern already
// used for totalIncome/estimatedAmount in the same rule branch.
const projectId = 'demo-user-plans-aggregate-legacy-compat';
let testEnv: RulesTestEnvironment;
const now = new Date('2026-08-05T10:00:00.000Z');

type FieldShape = 'present' | 'absent';

async function seed(totalExpenseShape: FieldShape, memberCountShape: FieldShape) {
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

    await setDoc(doc(db, 'plans', 'plan-1', 'members', 'member-owner'), {
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
      permissions: { moduleAccess: {} },
      status: 'active',
      invitedAt: null,
      joinedAt: now,
      removedAt: null,
      createdByUserId: 'owner-user',
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(doc(db, 'plans', 'plan-1', 'members', 'member-editor'), {
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
      permissions: { moduleAccess: {} },
      status: 'active',
      invitedAt: null,
      joinedAt: now,
      removedAt: null,
      createdByUserId: 'owner-user',
      createdAt: now,
      updatedAt: now,
    });

    // The requester's OWN userPlans doc — modern shape, needed for
    // isPlanVisible() (the requester's own doc must exist with
    // memberStatus == 'active'). Not the doc under test.
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

    // The owner's userPlans doc — the actual write target in every test below,
    // shaped legacy or modern per the params.
    const ownerUserPlanDoc: Record<string, unknown> = {
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
      joinedAt: now,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    };
    if (totalExpenseShape === 'present') {
      ownerUserPlanDoc.totalExpense = 0;
    }
    if (memberCountShape === 'present') {
      ownerUserPlanDoc.memberCount = 2;
    }
    // 'absent' — leave the key out entirely, same as a real pre-migration doc.

    await setDoc(doc(db, 'userPlans', 'owner-user', 'plans', 'plan-1'), ownerUserPlanDoc);
  });
}

describe('userPlans aggregate sync — totalExpense/memberCount legacy compatibility', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId,
      firestore: { rules: readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8') },
    });
  });

  afterAll(async () => {
    if (testEnv) await testEnv.cleanup();
  });

  function editorDb() {
    return testEnv.authenticatedContext('editor-user').firestore();
  }

  // Mirrors deleteMilestone()'s actual syncUserPlansAggregate() payload shape —
  // milestone/todo counters only, never touches totalExpense or memberCount.
  function milestoneCounterOnlySync() {
    return updateDoc(doc(editorDb(), 'userPlans', 'owner-user', 'plans', 'plan-1'), {
      milestoneCount: 0,
      todoCount: -1,
      updatedAt: now,
    });
  }

  describe('legacy owner userPlans doc — totalExpense and memberCount both absent', () => {
    it('a non-owner member syncing milestone/todo counters (never touching totalExpense/memberCount) succeeds', async () => {
      await testEnv.clearFirestore();
      await seed('absent', 'absent');
      await assertSucceeds(milestoneCounterOnlySync());
    });

    it('sneaking an identity/role field change into the same sync is still denied', async () => {
      await testEnv.clearFirestore();
      await seed('absent', 'absent');
      // The owner's userPlans doc is seeded with role: 'owner' — 'editor' is a
      // genuine attempted change, not a no-op equal to the existing value.
      await assertFails(
        updateDoc(doc(editorDb(), 'userPlans', 'owner-user', 'plans', 'plan-1'), {
          milestoneCount: 0,
          role: 'editor',
          updatedAt: now,
        }),
      );
    });
  });

  describe('mixed legacy shape — only one of the two fields absent', () => {
    it('totalExpense absent, memberCount present — counter sync succeeds', async () => {
      await testEnv.clearFirestore();
      await seed('absent', 'present');
      await assertSucceeds(milestoneCounterOnlySync());
    });

    it('totalExpense present, memberCount absent — counter sync succeeds', async () => {
      await testEnv.clearFirestore();
      await seed('present', 'absent');
      await assertSucceeds(milestoneCounterOnlySync());
    });
  });

  describe('modern owner userPlans doc — totalExpense and memberCount both present', () => {
    it('milestone/todo counter sync still succeeds (no regression)', async () => {
      await testEnv.clearFirestore();
      await seed('present', 'present');
      await assertSucceeds(milestoneCounterOnlySync());
    });

    it('the existing totalExpense/memberCount sync path still succeeds', async () => {
      await testEnv.clearFirestore();
      await seed('present', 'present');
      await assertSucceeds(
        updateDoc(doc(editorDb(), 'userPlans', 'owner-user', 'plans', 'plan-1'), {
          totalExpense: 500,
          memberCount: 2,
          updatedAt: now,
        }),
      );
    });

    it('setting totalExpense to a non-int value is still denied', async () => {
      await testEnv.clearFirestore();
      await seed('present', 'present');
      await assertFails(
        updateDoc(doc(editorDb(), 'userPlans', 'owner-user', 'plans', 'plan-1'), {
          totalExpense: 'not-a-number',
          updatedAt: now,
        }),
      );
    });

    it('setting memberCount to a non-int value is still denied', async () => {
      await testEnv.clearFirestore();
      await seed('present', 'present');
      await assertFails(
        updateDoc(doc(editorDb(), 'userPlans', 'owner-user', 'plans', 'plan-1'), {
          memberCount: 'not-a-number',
          updatedAt: now,
        }),
      );
    });
  });
});
