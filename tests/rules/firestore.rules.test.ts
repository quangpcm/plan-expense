import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const projectId = 'demo-plan-expense';
let testEnv: RulesTestEnvironment;

const now = new Date('2026-08-05T10:00:00.000Z');

async function seedBasePlan() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, 'plans', 'plan-1'), {
      id: 'plan-1',
      name: 'Trip',
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
      memberCount: 3,
      expenseCount: 1,
      incomeCount: 0,
      settlementCount: 0,
      totalExpense: 300,
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
      avatarUrl: null,
      role: 'owner',
      permissions: { canEditAllExpenses: true },
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
      avatarUrl: null,
      role: 'editor',
      permissions: { canEditAllExpenses: false },
      status: 'active',
      invitedAt: null,
      joinedAt: now,
      removedAt: null,
      createdByUserId: 'owner-user',
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(doc(db, 'plans', 'plan-1', 'members', 'member-viewer'), {
      id: 'member-viewer',
      planId: 'plan-1',
      memberType: 'registered',
      userId: 'viewer-user',
      email: 'viewer@example.com',
      nickname: 'Viewer',
      avatarUrl: null,
      role: 'viewer',
      permissions: { canEditAllExpenses: false },
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
      planName: 'Trip',
      planType: 'travel',
      role: 'owner',
      memberId: 'member-owner',
      memberStatus: 'active',
      planStatus: 'active',
      coverImageUrl: null,
      totalExpense: 500,
      memberCount: 3,
      joinedAt: now,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(doc(db, 'userPlans', 'editor-user', 'plans', 'plan-1'), {
      id: 'plan-1',
      planId: 'plan-1',
      userId: 'editor-user',
      planName: 'Trip',
      planType: 'travel',
      role: 'editor',
      memberId: 'member-editor',
      memberStatus: 'active',
      planStatus: 'active',
      coverImageUrl: null,
      totalExpense: 500,
      memberCount: 3,
      joinedAt: now,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(doc(db, 'userPlans', 'viewer-user', 'plans', 'plan-1'), {
      id: 'plan-1',
      planId: 'plan-1',
      userId: 'viewer-user',
      planName: 'Trip',
      planType: 'travel',
      role: 'viewer',
      memberId: 'member-viewer',
      memberStatus: 'active',
      planStatus: 'active',
      coverImageUrl: null,
      totalExpense: 500,
      memberCount: 3,
      joinedAt: now,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(doc(db, 'plans', 'plan-1', 'expenses', 'expense-owner'), {
      id: 'expense-owner',
      planId: 'plan-1',
      title: 'Hotel',
      categoryId: null,
      amount: 300,
      currency: 'VND',
      paidByMemberId: 'member-owner',
      participants: [],
      splitMethod: 'equal',
      merchantName: null,
      locationName: null,
      note: null,
      attachments: [],
      spentAt: now,
      createdByUserId: 'owner-user',
      createdByMemberId: 'member-owner',
      createdAt: now,
      updatedAt: now,
      status: 'active',
      deletedAt: null,
      deletedByUserId: null,
      version: 1,
    });

    await setDoc(doc(db, 'plans', 'plan-1', 'expenses', 'expense-editor'), {
      id: 'expense-editor',
      planId: 'plan-1',
      title: 'Dinner',
      categoryId: null,
      amount: 200,
      currency: 'VND',
      paidByMemberId: 'member-editor',
      participants: [],
      splitMethod: 'equal',
      merchantName: null,
      locationName: null,
      note: null,
      attachments: [],
      spentAt: now,
      createdByUserId: 'editor-user',
      createdByMemberId: 'member-editor',
      createdAt: now,
      updatedAt: now,
      status: 'active',
      deletedAt: null,
      deletedByUserId: null,
      version: 1,
    });
  });
}

describe('firestore rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId,
      firestore: {
        rules: readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8'),
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await seedBasePlan();
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  it('blocks users outside the plan from reading the plan', async () => {
    const db = testEnv.authenticatedContext('outsider-user').firestore();
    await assertFails(getDoc(doc(db, 'plans', 'plan-1')));
  });

  it('blocks viewer from creating expenses', async () => {
    const db = testEnv.authenticatedContext('viewer-user').firestore();
    await assertFails(
      setDoc(doc(db, 'plans', 'plan-1', 'expenses', 'expense-viewer'), {
        id: 'expense-viewer',
        planId: 'plan-1',
        title: 'Snack',
        categoryId: null,
        amount: 100,
        currency: 'VND',
        paidByMemberId: 'member-viewer',
        participants: [],
        splitMethod: 'equal',
        merchantName: null,
        locationName: null,
        note: null,
        attachments: [],
        spentAt: now,
        createdByUserId: 'viewer-user',
        createdByMemberId: 'member-viewer',
        createdAt: now,
        updatedAt: now,
        status: 'active',
        deletedAt: null,
        deletedByUserId: null,
        version: 1,
      }),
    );
  });

  it('allows editor to create an expense', async () => {
    const db = testEnv.authenticatedContext('editor-user').firestore();
    await assertSucceeds(
      setDoc(doc(db, 'plans', 'plan-1', 'expenses', 'expense-new'), {
        id: 'expense-new',
        planId: 'plan-1',
        title: 'Taxi',
        categoryId: null,
        amount: 100,
        currency: 'VND',
        paidByMemberId: 'member-editor',
        participants: [],
        splitMethod: 'equal',
        merchantName: null,
        locationName: null,
        note: null,
        attachments: [],
        spentAt: now,
        createdByUserId: 'editor-user',
        createdByMemberId: 'member-editor',
        createdAt: now,
        updatedAt: now,
        status: 'active',
        deletedAt: null,
        deletedByUserId: null,
        version: 1,
      }),
    );
  });

  it('allows editor to edit their own expense but not someone else expense', async () => {
    const db = testEnv.authenticatedContext('editor-user').firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'plans', 'plan-1', 'expenses', 'expense-editor'), {
        title: 'Updated Dinner',
        updatedAt: now,
        version: 2,
      }),
    );
    await assertFails(
      updateDoc(doc(db, 'plans', 'plan-1', 'expenses', 'expense-owner'), {
        title: 'Illegal edit',
        updatedAt: now,
        version: 2,
      }),
    );
  });

  it('allows canEditAllExpenses member to edit someone else expense', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'plans', 'plan-1', 'members', 'member-editor'), {
        permissions: { canEditAllExpenses: true },
      });
    });

    const db = testEnv.authenticatedContext('editor-user').firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'plans', 'plan-1', 'expenses', 'expense-owner'), {
        title: 'Delegated edit',
        updatedAt: now,
        version: 2,
      }),
    );
  });

  it('prevents user from promoting themselves to owner', async () => {
    const db = testEnv.authenticatedContext('editor-user').firestore();
    await assertFails(
      updateDoc(doc(db, 'plans', 'plan-1', 'members', 'member-editor'), {
        role: 'owner',
        updatedAt: now,
      }),
    );
  });

  it('prevents user from adding themselves into a plan', async () => {
    const db = testEnv.authenticatedContext('editor-user').firestore();
    await assertFails(
      setDoc(doc(db, 'plans', 'plan-1', 'members', 'member-hijack'), {
        id: 'member-hijack',
        planId: 'plan-1',
        memberType: 'registered',
        userId: 'editor-user',
        email: 'editor@example.com',
        nickname: 'Hacker',
        avatarUrl: null,
        role: 'editor',
        permissions: { canEditAllExpenses: false },
        status: 'active',
        invitedAt: null,
        joinedAt: now,
        removedAt: null,
        createdByUserId: 'editor-user',
        createdAt: now,
        updatedAt: now,
      }),
    );
  });

  it('blocks expense creation when plan is closed', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'plans', 'plan-1'), {
        status: 'closed',
        closedAt: now,
      });
      await updateDoc(doc(context.firestore(), 'userPlans', 'editor-user', 'plans', 'plan-1'), {
        planStatus: 'closed',
      });
    });

    const db = testEnv.authenticatedContext('editor-user').firestore();
    await assertFails(
      setDoc(doc(db, 'plans', 'plan-1', 'expenses', 'expense-closed'), {
        id: 'expense-closed',
        planId: 'plan-1',
        title: 'Late expense',
        categoryId: null,
        amount: 100,
        currency: 'VND',
        paidByMemberId: 'member-editor',
        participants: [],
        splitMethod: 'equal',
        merchantName: null,
        locationName: null,
        note: null,
        attachments: [],
        spentAt: now,
        createdByUserId: 'editor-user',
        createdByMemberId: 'member-editor',
        createdAt: now,
        updatedAt: now,
        status: 'active',
        deletedAt: null,
        deletedByUserId: null,
        version: 1,
      }),
    );
  });

  it('allows a non-owner plan member to sync totalExpense/memberCount into another member userPlans doc', async () => {
    const db = testEnv.authenticatedContext('editor-user').firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'userPlans', 'owner-user', 'plans', 'plan-1'), {
        totalExpense: 700,
        memberCount: 3,
        updatedAt: now,
      }),
    );
  });

  it('blocks a non-owner plan member from sneaking other field changes into a userPlans aggregate sync', async () => {
    const db = testEnv.authenticatedContext('editor-user').firestore();
    await assertFails(
      updateDoc(doc(db, 'userPlans', 'owner-user', 'plans', 'plan-1'), {
        totalExpense: 700,
        role: 'editor',
        updatedAt: now,
      }),
    );
  });

  it('blocks a user outside the plan from writing to a userPlans aggregate sync', async () => {
    const db = testEnv.authenticatedContext('outsider-user').firestore();
    await assertFails(
      updateDoc(doc(db, 'userPlans', 'owner-user', 'plans', 'plan-1'), {
        totalExpense: 700,
        memberCount: 3,
        updatedAt: now,
      }),
    );
  });
});
