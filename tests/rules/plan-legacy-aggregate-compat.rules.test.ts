import { readFileSync } from 'node:fs';
import path from 'node:path';

import { assertFails, assertSucceeds, type RulesTestEnvironment, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, increment, setDoc, writeBatch } from 'firebase/firestore';
import { afterAll, beforeAll, describe, it } from 'vitest';

const projectId = 'demo-plan-legacy-aggregate-compat';
let testEnv: RulesTestEnvironment;
const now = new Date('2026-08-27T09:50:00.000Z');

type LegacyCounterShape = 'present' | 'absent';

async function seed(
  completedMilestoneCountShape: LegacyCounterShape = 'present',
  completedTodoCountShape: LegacyCounterShape = 'present',
  estimatedAmountShape: LegacyCounterShape = 'present',
) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    const plan: Record<string, unknown> = {
      id: 'plan-1',
      name: 'Legacy plan',
      description: null,
      planType: 'travel',
      ownerUserId: 'owner-user',
      ownerMemberId: 'member-owner',
      currency: 'VND',
      timezone: 'Asia/Ho_Chi_Minh',
      coverImageUrl: null,
      coverImageStoragePath: null,
      startDate: null,
      endDate: null,
      status: 'active',
      memberCount: 1,
      milestoneCount: 1,
      todoCount: 0,
      expenseCount: 0,
      incomeCount: 0,
      settlementCount: 0,
      totalExpense: 0,
      totalIncome: 0,
      createdAt: now,
      updatedAt: now,
      closedAt: null,
      archivedAt: null,
    };
    if (completedMilestoneCountShape === 'present') {
      plan.completedMilestoneCount = 0;
    }
    if (completedTodoCountShape === 'present') {
      plan.completedTodoCount = 0;
    }
    if (estimatedAmountShape === 'present') {
      plan.estimatedAmount = 0;
    }
    await setDoc(doc(db, 'plans', 'plan-1'), plan);

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

    await setDoc(doc(db, 'userPlans', 'owner-user', 'plans', 'plan-1'), {
      id: 'plan-1',
      planId: 'plan-1',
      userId: 'owner-user',
      planName: 'Legacy plan',
      planType: 'travel',
      role: 'owner',
      memberId: 'member-owner',
      memberStatus: 'active',
      planStatus: 'active',
      coverImageUrl: null,
      totalExpense: 0,
      memberCount: 1,
      joinedAt: now,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(doc(db, 'plans', 'plan-1', 'milestones', 'milestone-1'), {
      id: 'milestone-1',
      planId: 'plan-1',
      title: 'M1',
      description: null,
      startDate: null,
      endDate: null,
      orderIndex: 0,
      estimatedAmount: 0,
      totalExpense: 0,
      todoCount: 0,
      completedTodoCount: 0,
      status: 'in_progress',
      isSystemHidden: false,
      createdByUserId: 'owner-user',
      createdAt: now,
      updatedAt: now,
    });
  });
}

describe('plan aggregate legacy compatibility', () => {
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

  function createTodoTransactionShape() {
    const db = ownerDb();
    const batch = writeBatch(db);
    batch.set(doc(db, 'plans', 'plan-1', 'todos', 'todo-1'), {
      id: 'todo-1',
      planId: 'plan-1',
      milestoneId: 'milestone-1',
      orderIndex: 1000,
      title: 'Todo',
      description: null,
      assigneeMemberId: null,
      dueDate: null,
      priority: 'medium',
      status: 'todo',
      budget: null,
      vendors: [],
      selectedTodoVendorId: null,
      attachments: [],
      createdByUserId: 'owner-user',
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      cancelledAt: null,
    });
    batch.update(doc(db, 'plans', 'plan-1'), {
      todoCount: increment(1),
      estimatedAmount: increment(0),
      updatedAt: now,
    });
    batch.update(doc(db, 'plans', 'plan-1', 'milestones', 'milestone-1'), {
      todoCount: increment(1),
      estimatedAmount: increment(0),
      updatedAt: now,
    });
    return batch.commit();
  }

  function createMilestoneTransactionShape() {
    const db = ownerDb();
    const batch = writeBatch(db);
    batch.set(doc(db, 'plans', 'plan-1', 'milestones', 'milestone-2'), {
      id: 'milestone-2',
      planId: 'plan-1',
      title: 'M2',
      description: null,
      iconId: null,
      isSystemHidden: false,
      startDate: null,
      endDate: null,
      status: 'upcoming',
      orderIndex: 1,
      budgetAmount: null,
      estimatedAmount: 0,
      totalExpense: 0,
      todoCount: 0,
      completedTodoCount: 0,
      createdByUserId: 'owner-user',
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      cancelledAt: null,
    });
    batch.update(doc(db, 'plans', 'plan-1'), {
      milestoneCount: increment(1),
      updatedAt: now,
    });
    return batch.commit();
  }

  it('Todo create transaction succeeds when completedTodoCount is absent on a legacy plan', async () => {
    await testEnv.clearFirestore();
    await seed('present', 'absent', 'present');
    await assertSucceeds(createTodoTransactionShape());
  });

  it('Milestone create transaction succeeds when completedMilestoneCount is absent on a legacy plan', async () => {
    await testEnv.clearFirestore();
    await seed('absent', 'present', 'present');
    await assertSucceeds(createMilestoneTransactionShape());
  });

  it('Todo create transaction succeeds when estimatedAmount is absent on a legacy plan', async () => {
    await testEnv.clearFirestore();
    await seed('present', 'present', 'absent');
    await assertSucceeds(createTodoTransactionShape());
  });

  it('Still denies invalid non-int replacements for optional counters', async () => {
    await testEnv.clearFirestore();
    await seed('present', 'present', 'present');
    await assertFails(
      setDoc(
        doc(ownerDb(), 'plans', 'plan-1'),
        {
          id: 'plan-1',
          name: 'Legacy plan',
          description: null,
          planType: 'travel',
          ownerUserId: 'owner-user',
          ownerMemberId: 'member-owner',
          currency: 'VND',
          timezone: 'Asia/Ho_Chi_Minh',
          coverImageUrl: null,
          coverImageStoragePath: null,
          startDate: null,
          endDate: null,
          status: 'active',
          memberCount: 1,
          milestoneCount: 1,
          completedMilestoneCount: 'bad',
          todoCount: 0,
          completedTodoCount: 0,
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
        },
        { merge: false },
      ),
    );
  });
});
