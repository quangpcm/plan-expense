import { readFileSync } from 'node:fs';
import path from 'node:path';

import { assertFails, assertSucceeds, type RulesTestEnvironment, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, describe, it } from 'vitest';

// Regression coverage for the "Edit Expense/Income fails" investigation.
// Root cause: the Expense/Income update rules directly compared
// `request.resource.data.createdByMemberId == resource.data.createdByMemberId`.
// Firestore rules throw an evaluation error the moment either side is
// missing the key (confirmed via this same harness). Legacy Expense/Income
// documents created before `createdByMemberId` existed have no such key, so
// every edit against them was denied. Fixed via optionalFieldUnchanged() in
// firestore.rules, which treats "absent on both sides" as unchanged while
// still denying any transition that actually adds, removes, or changes the
// field's value.
const projectId = 'demo-expense-income-legacy-compat';
let testEnv: RulesTestEnvironment;
const now = new Date('2026-08-05T10:00:00.000Z');

type CreatedByMemberIdShape = 'present' | 'absent';

async function seed(expenseShape: CreatedByMemberIdShape, incomeShape: CreatedByMemberIdShape) {
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
      memberCount: 1,
      milestoneCount: 1,
      todoCount: 0,
      expenseCount: 1,
      incomeCount: 1,
      settlementCount: 0,
      estimatedAmount: 0,
      totalExpense: 100,
      totalIncome: 100,
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

    await setDoc(doc(db, 'plans', 'plan-1', 'members', 'member-other'), {
      id: 'member-other',
      planId: 'plan-1',
      memberType: 'registered',
      userId: 'other-user',
      email: 'other@example.com',
      nickname: 'Other',
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
      totalExpense: 100,
      memberCount: 1,
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
      totalExpense: 100,
      status: 'in_progress',
      isSystemHidden: false,
      createdByUserId: 'owner-user',
      createdAt: now,
      updatedAt: now,
    });

    const expenseDoc: Record<string, unknown> = {
      id: 'expense-1',
      planId: 'plan-1',
      milestoneId: 'milestone-1',
      title: 'Old expense',
      categoryId: null,
      amount: 100,
      currency: 'VND',
      paymentSourceType: 'member',
      paidByMemberId: 'member-owner',
      participants: [],
      status: 'active',
      createdByUserId: 'owner-user',
      createdAt: now,
      updatedAt: now,
    };
    if (expenseShape === 'present') {
      expenseDoc.createdByMemberId = 'member-owner';
    }
    await setDoc(doc(db, 'plans', 'plan-1', 'expenses', 'expense-1'), expenseDoc);

    const incomeDoc: Record<string, unknown> = {
      id: 'income-1',
      planId: 'plan-1',
      milestoneId: 'milestone-1',
      title: 'Old income',
      categoryId: null,
      amount: 100,
      currency: 'VND',
      contributedByMemberId: 'member-owner',
      allocatedToMemberId: null,
      status: 'active',
      createdByUserId: 'owner-user',
      createdAt: now,
      updatedAt: now,
    };
    if (incomeShape === 'present') {
      incomeDoc.createdByMemberId = 'member-owner';
    }
    await setDoc(doc(db, 'plans', 'plan-1', 'incomes', 'income-1'), incomeDoc);
  });
}

describe('Expense/Income createdByMemberId legacy compatibility', () => {
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

  function editExpenseAllowedFields(overrides: Record<string, unknown> = {}) {
    return updateDoc(doc(ownerDb(), 'plans', 'plan-1', 'expenses', 'expense-1'), {
      title: 'Old expense (edited)',
      amount: 150,
      paymentSourceType: 'member',
      paidByMemberId: 'member-owner',
      updatedAt: now,
      ...overrides,
    });
  }

  function editIncomeAllowedFields(overrides: Record<string, unknown> = {}) {
    return updateDoc(doc(ownerDb(), 'plans', 'plan-1', 'incomes', 'income-1'), {
      title: 'Old income (edited)',
      amount: 150,
      contributedByMemberId: 'member-owner',
      allocatedToMemberId: null,
      updatedAt: now,
      ...overrides,
    });
  }

  describe('Expense', () => {
    it('legacy Expense missing createdByMemberId can edit allowed fields', async () => {
      await testEnv.clearFirestore();
      await seed('absent', 'present');
      await assertSucceeds(editExpenseAllowedFields());
    });

    it('modern Expense (createdByMemberId present) can edit', async () => {
      await testEnv.clearFirestore();
      await seed('present', 'present');
      await assertSucceeds(editExpenseAllowedFields());
    });

    it('changing createdByMemberId on a modern Expense is denied', async () => {
      await testEnv.clearFirestore();
      await seed('present', 'present');
      await assertFails(editExpenseAllowedFields({ createdByMemberId: 'member-other' }));
    });

    it('adding createdByMemberId to a legacy Expense through a normal edit is denied', async () => {
      await testEnv.clearFirestore();
      await seed('absent', 'present');
      await assertFails(editExpenseAllowedFields({ createdByMemberId: 'member-owner' }));
    });
  });

  describe('Income', () => {
    it('legacy Income missing createdByMemberId can edit allowed fields', async () => {
      await testEnv.clearFirestore();
      await seed('present', 'absent');
      await assertSucceeds(editIncomeAllowedFields());
    });

    it('modern Income (createdByMemberId present) can edit', async () => {
      await testEnv.clearFirestore();
      await seed('present', 'present');
      await assertSucceeds(editIncomeAllowedFields());
    });

    it('changing createdByMemberId on a modern Income is denied', async () => {
      await testEnv.clearFirestore();
      await seed('present', 'present');
      await assertFails(editIncomeAllowedFields({ createdByMemberId: 'member-other' }));
    });

    it('adding createdByMemberId to a legacy Income through a normal edit is denied', async () => {
      await testEnv.clearFirestore();
      await seed('present', 'absent');
      await assertFails(editIncomeAllowedFields({ createdByMemberId: 'member-owner' }));
    });
  });
});
