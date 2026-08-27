import { readFileSync } from 'node:fs';
import path from 'node:path';

import { assertFails, assertSucceeds, type RulesTestEnvironment, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, increment, setDoc, updateDoc } from 'firebase/firestore';
import { afterAll, beforeAll, describe, it } from 'vitest';

// Regression coverage for the "owner can't add a Todo vendor" investigation.
// Root cause: milestoneIsWritable() and the milestone update/delete rules
// dot-accessed `isSystemHidden` directly. Firestore rules throw an
// evaluation error on a missing map key (confirmed via this same harness,
// error text: "Property isSystemHidden is undefined on object."), which
// denies the whole containing `allow` regardless of role/ownership. Legacy
// milestones created before this field existed (no backfill was ever run)
// have no such key, so every Todo create/update against them — and every
// Finance write whose transaction also touches the milestone's aggregate
// fields — was denied. Fixed via milestoneSystemHiddenFlag() in
// firestore.rules, which treats a missing key exactly like `false`.
const projectId = 'demo-milestone-legacy-compat';
let testEnv: RulesTestEnvironment;
const now = new Date('2026-08-05T10:00:00.000Z');

type MilestoneShape = 'modern-false' | 'legacy-missing' | 'system-hidden-true';
type CompletedTodoCountShape = 'present-int' | 'absent' | 'present-non-int';

async function seed(milestoneShape: MilestoneShape, completedTodoCountShape: CompletedTodoCountShape = 'present-int') {
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
      todoCount: 1,
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
      memberCount: 1,
      joinedAt: now,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const baseMilestone: Record<string, unknown> = {
      id: 'milestone-1',
      planId: 'plan-1',
      title: 'Le dinh hon',
      description: null,
      startDate: null,
      endDate: null,
      orderIndex: 0,
      todoCount: 1,
      estimatedAmount: 0,
      totalExpense: 0,
      status: 'in_progress',
      createdByUserId: 'owner-user',
      createdAt: now,
      updatedAt: now,
    };
    if (completedTodoCountShape === 'present-int') {
      baseMilestone.completedTodoCount = 0;
    } else if (completedTodoCountShape === 'present-non-int') {
      baseMilestone.completedTodoCount = 'not-a-number';
    }
    // 'absent' — leave the key out entirely.

    const milestoneDoc =
      milestoneShape === 'modern-false'
        ? { ...baseMilestone, isSystemHidden: false }
        : milestoneShape === 'system-hidden-true'
          ? { ...baseMilestone, isSystemHidden: true }
          : baseMilestone; // 'legacy-missing' — no isSystemHidden key at all

    await setDoc(doc(db, 'plans', 'plan-1', 'milestones', 'milestone-1'), milestoneDoc);

    await setDoc(doc(db, 'plans', 'plan-1', 'todos', 'todo-existing'), {
      id: 'todo-existing',
      planId: 'plan-1',
      milestoneId: 'milestone-1',
      title: 'Ao dai bang vai',
      description: null,
      assigneeMemberId: null,
      dueDate: null,
      priority: 'medium',
      status: 'todo',
      createdByUserId: 'owner-user',
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      cancelledAt: null,
    });
  });
}

describe('milestone isSystemHidden legacy compatibility', () => {
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

  function addVendorShapedUpdate() {
    return updateDoc(doc(ownerDb(), 'plans', 'plan-1', 'todos', 'todo-existing'), {
      vendors: [{ id: 'v1', name: 'Bao Khanh', description: null, link: null, price: 500000, attachments: [] }],
      updatedAt: now,
    });
  }

  function createTodoAgainstMilestone1() {
    return setDoc(doc(ownerDb(), 'plans', 'plan-1', 'todos', 'todo-new'), {
      id: 'todo-new',
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
      createdByUserId: 'owner-user',
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      cancelledAt: null,
    });
  }

  function milestoneAggregateUpdate() {
    return updateDoc(doc(ownerDb(), 'plans', 'plan-1', 'milestones', 'milestone-1'), {
      todoCount: increment(1),
      estimatedAmount: increment(0),
      updatedAt: now,
    });
  }

  function createExpenseAgainstMilestone1() {
    // Isolated expense-create-rule check — the expense rule itself never
    // references isSystemHidden. The real createExpense() transaction also
    // writes the milestone's aggregate fields in the same commit, which is
    // exactly `milestoneAggregateUpdate()` above applied from a different
    // call site — covered there, not duplicated here.
    return setDoc(doc(ownerDb(), 'plans', 'plan-1', 'expenses', 'expense-new'), {
      id: 'expense-new',
      planId: 'plan-1',
      milestoneId: 'milestone-1',
      title: 'Snack',
      categoryId: null,
      amount: 100,
      currency: 'VND',
      paymentSourceType: 'member',
      paidByMemberId: 'member-owner',
      participants: [],
      status: 'active',
      createdByUserId: 'owner-user',
      createdByMemberId: 'member-owner',
      createdAt: now,
      updatedAt: now,
    });
  }

  // Mirrors FirestoreTodoRepository.updateTodo's actual milestone touch —
  // the one write shape that DOES touch completedTodoCount (via increment,
  // which auto-creates the field even if it was absent).
  function updateTodoMilestoneAggregateTouch() {
    return updateDoc(doc(ownerDb(), 'plans', 'plan-1', 'milestones', 'milestone-1'), {
      completedTodoCount: increment(0),
      estimatedAmount: increment(0),
      updatedAt: now,
    });
  }

  function setMilestoneCompletedTodoCountTo(value: unknown) {
    return updateDoc(doc(ownerDb(), 'plans', 'plan-1', 'milestones', 'milestone-1'), {
      completedTodoCount: value,
      updatedAt: now,
    });
  }

  describe('legacy milestone — isSystemHidden field absent (behaves like false)', () => {
    it('Todo create succeeds', async () => {
      await testEnv.clearFirestore();
      await seed('legacy-missing');
      await assertSucceeds(createTodoAgainstMilestone1());
    });

    it('Todo update / addVendor succeeds', async () => {
      await testEnv.clearFirestore();
      await seed('legacy-missing');
      await assertSucceeds(addVendorShapedUpdate());
    });

    it('milestone aggregate update succeeds', async () => {
      await testEnv.clearFirestore();
      await seed('legacy-missing');
      await assertSucceeds(milestoneAggregateUpdate());
    });

    it('Expense create (Finance flow touching the same milestone) succeeds', async () => {
      await testEnv.clearFirestore();
      await seed('legacy-missing');
      await assertSucceeds(createExpenseAgainstMilestone1());
    });
  });

  describe('modern milestone — isSystemHidden: false', () => {
    it('Todo create succeeds', async () => {
      await testEnv.clearFirestore();
      await seed('modern-false');
      await assertSucceeds(createTodoAgainstMilestone1());
    });

    it('Todo update / addVendor succeeds', async () => {
      await testEnv.clearFirestore();
      await seed('modern-false');
      await assertSucceeds(addVendorShapedUpdate());
    });

    it('milestone aggregate update succeeds', async () => {
      await testEnv.clearFirestore();
      await seed('modern-false');
      await assertSucceeds(milestoneAggregateUpdate());
    });

    it('Expense create succeeds', async () => {
      await testEnv.clearFirestore();
      await seed('modern-false');
      await assertSucceeds(createExpenseAgainstMilestone1());
    });
  });

  describe('system-hidden milestone — isSystemHidden: true (must remain protected)', () => {
    it('Todo create against it is denied', async () => {
      await testEnv.clearFirestore();
      await seed('system-hidden-true');
      await assertFails(createTodoAgainstMilestone1());
    });

    it('Todo update / addVendor against an existing todo under it is denied', async () => {
      await testEnv.clearFirestore();
      await seed('system-hidden-true');
      await assertFails(addVendorShapedUpdate());
    });

    it('milestone update (aggregate or otherwise) is denied', async () => {
      await testEnv.clearFirestore();
      await seed('system-hidden-true');
      await assertFails(milestoneAggregateUpdate());
    });

    it('milestone delete is denied', async () => {
      await testEnv.clearFirestore();
      await seed('system-hidden-true');
      await assertFails(deleteDoc(doc(ownerDb(), 'plans', 'plan-1', 'milestones', 'milestone-1')));
    });
  });

  describe('legacy milestone — completedTodoCount field absent (behaves like an unset counter)', () => {
    it('Todo create succeeds', async () => {
      await testEnv.clearFirestore();
      await seed('modern-false', 'absent');
      await assertSucceeds(createTodoAgainstMilestone1());
    });

    it('Todo update (the write that touches completedTodoCount via increment) succeeds', async () => {
      await testEnv.clearFirestore();
      await seed('modern-false', 'absent');
      await assertSucceeds(updateTodoMilestoneAggregateTouch());
    });

    it('milestone aggregate update (a write that does not touch completedTodoCount) succeeds', async () => {
      await testEnv.clearFirestore();
      await seed('modern-false', 'absent');
      await assertSucceeds(milestoneAggregateUpdate());
    });

    it('Expense/Income aggregate path (totalExpense-only touch) succeeds', async () => {
      await testEnv.clearFirestore();
      await seed('modern-false', 'absent');
      await assertSucceeds(createExpenseAgainstMilestone1());
    });
  });

  describe('modern milestone — completedTodoCount: 0 (int)', () => {
    it('Todo create succeeds', async () => {
      await testEnv.clearFirestore();
      await seed('modern-false', 'present-int');
      await assertSucceeds(createTodoAgainstMilestone1());
    });

    it('Todo update succeeds', async () => {
      await testEnv.clearFirestore();
      await seed('modern-false', 'present-int');
      await assertSucceeds(updateTodoMilestoneAggregateTouch());
    });

    it('milestone aggregate update succeeds', async () => {
      await testEnv.clearFirestore();
      await seed('modern-false', 'present-int');
      await assertSucceeds(milestoneAggregateUpdate());
    });

    it('Expense/Income aggregate path succeeds', async () => {
      await testEnv.clearFirestore();
      await seed('modern-false', 'present-int');
      await assertSucceeds(createExpenseAgainstMilestone1());
    });
  });

  describe('completedTodoCount present but not an int — still denied', () => {
    it('a write that would leave completedTodoCount as a non-int value is denied', async () => {
      await testEnv.clearFirestore();
      await seed('modern-false', 'present-int');
      await assertFails(setMilestoneCompletedTodoCountTo('not-a-number'));
    });

    it('a milestone that already has a non-int completedTodoCount cannot be updated while leaving it as-is', async () => {
      await testEnv.clearFirestore();
      await seed('modern-false', 'present-non-int');
      await assertFails(milestoneAggregateUpdate());
    });
  });
});
