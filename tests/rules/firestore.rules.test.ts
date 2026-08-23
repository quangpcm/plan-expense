import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
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
      milestoneCount: 1,
      todoCount: 1,
      expenseCount: 1,
      incomeCount: 0,
      settlementCount: 0,
      estimatedAmount: 1200,
      totalExpense: 300,
      totalIncome: 0,
      createdAt: now,
      updatedAt: now,
      closedAt: null,
      archivedAt: null,
    });

    await setDoc(doc(db, 'plans', 'plan-2'), {
      id: 'plan-2',
      name: 'Debt Plan',
      description: null,
      planType: 'debt',
      ownerUserId: 'owner-user',
      ownerMemberId: 'member-owner-2',
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
      expenseCount: 1,
      incomeCount: 1,
      settlementCount: 0,
      estimatedAmount: 0,
      totalExpense: 80,
      totalIncome: 500,
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
      permissions: { moduleAccess: {} },
      status: 'active',
      invitedAt: null,
      joinedAt: now,
      removedAt: null,
      createdByUserId: 'owner-user',
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(doc(db, 'plans', 'plan-2', 'members', 'member-owner-2'), {
      id: 'member-owner-2',
      planId: 'plan-2',
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

    await setDoc(doc(db, 'plans', 'plan-2', 'members', 'member-editor-2'), {
      id: 'member-editor-2',
      planId: 'plan-2',
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
      estimatedAmount: 1200,
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
      estimatedAmount: 1200,
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
      estimatedAmount: 1200,
      totalExpense: 500,
      memberCount: 3,
      joinedAt: now,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(doc(db, 'userPlans', 'owner-user', 'plans', 'plan-2'), {
      id: 'plan-2',
      planId: 'plan-2',
      userId: 'owner-user',
      planName: 'Debt Plan',
      planType: 'debt',
      role: 'owner',
      memberId: 'member-owner-2',
      memberStatus: 'active',
      planStatus: 'active',
      coverImageUrl: null,
      estimatedAmount: 0,
      totalExpense: 80,
      totalIncome: 500,
      memberCount: 2,
      joinedAt: now,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(doc(db, 'userPlans', 'editor-user', 'plans', 'plan-2'), {
      id: 'plan-2',
      planId: 'plan-2',
      userId: 'editor-user',
      planName: 'Debt Plan',
      planType: 'debt',
      role: 'editor',
      memberId: 'member-editor-2',
      memberStatus: 'active',
      planStatus: 'active',
      coverImageUrl: null,
      estimatedAmount: 0,
      totalExpense: 80,
      totalIncome: 500,
      memberCount: 2,
      joinedAt: now,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(doc(db, 'plans', 'plan-1', 'expenses', 'expense-owner'), {
      id: 'expense-owner',
      planId: 'plan-1',
      milestoneId: 'milestone-1',
      title: 'Hotel',
      categoryId: null,
      amount: 300,
      currency: 'VND',
      paymentSourceType: 'member',
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
      milestoneId: 'milestone-1',
      title: 'Dinner',
      categoryId: null,
      amount: 200,
      currency: 'VND',
      paymentSourceType: 'member',
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

    await setDoc(doc(db, 'plans', 'plan-1', 'incomes', 'income-owner'), {
      id: 'income-owner',
      planId: 'plan-1',
      milestoneId: 'milestone-1',
      title: 'Nap quy',
      categoryId: null,
      amount: 500,
      currency: 'VND',
      contributedByMemberId: 'member-owner',
      allocatedToMemberId: null,
      note: null,
      attachments: [],
      receivedAt: now,
      createdByUserId: 'owner-user',
      createdByMemberId: 'member-owner',
      createdAt: now,
      updatedAt: now,
      status: 'active',
      deletedAt: null,
      deletedByUserId: null,
      version: 1,
    });

    await setDoc(doc(db, 'plans', 'plan-1', 'incomes', 'income-editor'), {
      id: 'income-editor',
      planId: 'plan-1',
      milestoneId: 'milestone-1',
      title: 'Hoan tien',
      categoryId: null,
      amount: 150,
      currency: 'VND',
      contributedByMemberId: 'member-editor',
      allocatedToMemberId: null,
      note: null,
      attachments: [],
      receivedAt: now,
      createdByUserId: 'editor-user',
      createdByMemberId: 'member-editor',
      createdAt: now,
      updatedAt: now,
      status: 'active',
      deletedAt: null,
      deletedByUserId: null,
      version: 1,
    });

    const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const past = new Date(now.getTime() - 60 * 60 * 1000);

    await setDoc(doc(db, 'plans', 'plan-1', 'invitations', 'invite-email'), {
      id: 'invite-email',
      planId: 'plan-1',
      planName: 'Trip',
      planType: 'travel',
      coverImageUrl: null,
      targetMemberId: null,
      targetNickname: null,
      email: 'newuser@example.com',
      role: 'editor',
      status: 'pending',
      invitedByUserId: 'owner-user',
      expiresAt: future,
      acceptedAt: null,
      acceptedByUserId: null,
      revokedAt: null,
      revokedByUserId: null,
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(doc(db, 'plans', 'plan-1', 'invitations', 'invite-link'), {
      id: 'invite-link',
      planId: 'plan-1',
      planName: 'Trip',
      planType: 'travel',
      coverImageUrl: null,
      targetMemberId: null,
      targetNickname: null,
      email: null,
      role: 'viewer',
      status: 'pending',
      invitedByUserId: 'owner-user',
      expiresAt: future,
      acceptedAt: null,
      acceptedByUserId: null,
      revokedAt: null,
      revokedByUserId: null,
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(doc(db, 'plans', 'plan-1', 'invitations', 'invite-expired'), {
      id: 'invite-expired',
      planId: 'plan-1',
      planName: 'Trip',
      planType: 'travel',
      coverImageUrl: null,
      targetMemberId: null,
      targetNickname: null,
      email: null,
      role: 'viewer',
      status: 'pending',
      invitedByUserId: 'owner-user',
      expiresAt: past,
      acceptedAt: null,
      acceptedByUserId: null,
      revokedAt: null,
      revokedByUserId: null,
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(doc(db, 'plans', 'plan-1', 'members', 'member-guest'), {
      id: 'member-guest',
      planId: 'plan-1',
      memberType: 'guest',
      userId: null,
      email: null,
      nickname: 'LA',
      nicknameIsCustom: true,
      invitationId: null,
      avatarUrl: null,
      role: 'viewer',
      permissions: { moduleAccess: {} },
      status: 'active',
      invitedAt: null,
      joinedAt: now,
      removedAt: null,
      createdByUserId: 'owner-user',
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(doc(db, 'plans', 'plan-1', 'members', 'member-guest-2'), {
      id: 'member-guest-2',
      planId: 'plan-1',
      memberType: 'guest',
      userId: null,
      email: null,
      nickname: 'Other Guest',
      nicknameIsCustom: true,
      invitationId: null,
      avatarUrl: null,
      role: 'viewer',
      permissions: { moduleAccess: {} },
      status: 'active',
      invitedAt: null,
      joinedAt: now,
      removedAt: null,
      createdByUserId: 'owner-user',
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(doc(db, 'plans', 'plan-1', 'invitations', 'invite-claim'), {
      id: 'invite-claim',
      planId: 'plan-1',
      planName: 'Trip',
      planType: 'travel',
      coverImageUrl: null,
      targetMemberId: 'member-guest',
      targetNickname: 'LA',
      email: null,
      role: 'viewer',
      status: 'pending',
      invitedByUserId: 'owner-user',
      expiresAt: future,
      acceptedAt: null,
      acceptedByUserId: null,
      revokedAt: null,
      revokedByUserId: null,
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(doc(db, 'plans', 'plan-1', 'milestones', 'milestone-1'), {
      id: 'milestone-1',
      planId: 'plan-1',
      title: 'Book hotel',
      description: null,
      iconId: null,
      isSystemHidden: false,
      startDate: null,
      endDate: null,
      status: 'in_progress',
      orderIndex: 0,
      budgetAmount: 1000,
      totalExpense: 500,
      todoCount: 1,
      completedTodoCount: 0,
      createdByUserId: 'owner-user',
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      cancelledAt: null,
    });

    await setDoc(doc(db, 'plans', 'plan-1', 'milestones', 'milestone-hidden'), {
      id: 'milestone-hidden',
      planId: 'plan-1',
      title: '__system_hidden_milestone__',
      description: null,
      iconId: null,
      isSystemHidden: true,
      startDate: null,
      endDate: null,
      status: 'upcoming',
      orderIndex: 99,
      budgetAmount: null,
      totalExpense: 0,
      todoCount: 0,
      completedTodoCount: 0,
      createdByUserId: 'owner-user',
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      cancelledAt: null,
    });

    await setDoc(doc(db, 'plans', 'plan-2', 'milestones', 'milestone-hidden-debt'), {
      id: 'milestone-hidden-debt',
      planId: 'plan-2',
      title: '__system_hidden_milestone__',
      description: null,
      iconId: null,
      isSystemHidden: true,
      startDate: null,
      endDate: null,
      status: 'upcoming',
      orderIndex: 0,
      budgetAmount: null,
      totalExpense: 0,
      todoCount: 0,
      completedTodoCount: 0,
      createdByUserId: 'owner-user',
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      cancelledAt: null,
    });

    await setDoc(doc(db, 'plans', 'plan-2', 'expenses', 'expense-hidden'), {
      id: 'expense-hidden',
      planId: 'plan-2',
      milestoneId: 'milestone-hidden-debt',
      title: 'Repayment',
      categoryId: null,
      amount: 80,
      currency: 'VND',
      paymentSourceType: 'member',
      paidByMemberId: 'member-editor-2',
      participants: [],
      splitMethod: 'equal',
      merchantName: null,
      locationName: null,
      note: null,
      attachments: [],
      spentAt: now,
      createdByUserId: 'editor-user',
      createdByMemberId: 'member-editor-2',
      createdAt: now,
      updatedAt: now,
      status: 'active',
      deletedAt: null,
      deletedByUserId: null,
      version: 1,
    });

    await setDoc(doc(db, 'plans', 'plan-2', 'incomes', 'income-hidden'), {
      id: 'income-hidden',
      planId: 'plan-2',
      milestoneId: 'milestone-hidden-debt',
      title: 'Disbursement',
      categoryId: null,
      amount: 500,
      currency: 'VND',
      contributedByMemberId: 'member-owner-2',
      allocatedToMemberId: null,
      note: null,
      attachments: [],
      receivedAt: now,
      createdByUserId: 'owner-user',
      createdByMemberId: 'member-owner-2',
      createdAt: now,
      updatedAt: now,
      status: 'active',
      deletedAt: null,
      deletedByUserId: null,
      version: 1,
    });

    await setDoc(doc(db, 'plans', 'plan-1', 'todos', 'todo-1'), {
      id: 'todo-1',
      planId: 'plan-1',
      milestoneId: 'milestone-1',
      title: 'Confirm booking',
      description: null,
      assigneeMemberId: 'member-owner',
      dueDate: null,
      priority: 'high',
      status: 'todo',
      createdByUserId: 'owner-user',
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      cancelledAt: null,
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
        milestoneId: 'milestone-1',
        title: 'Snack',
        categoryId: null,
        amount: 100,
        currency: 'VND',
        paymentSourceType: 'member',
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
        milestoneId: 'milestone-1',
        title: 'Taxi',
        categoryId: null,
        amount: 100,
        currency: 'VND',
        paymentSourceType: 'member',
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

  it('allows editor to create a fund-paid expense with paidByMemberId null', async () => {
    const db = testEnv.authenticatedContext('editor-user').firestore();
    await assertSucceeds(
      setDoc(doc(db, 'plans', 'plan-1', 'expenses', 'expense-fund'), {
        id: 'expense-fund',
        planId: 'plan-1',
        milestoneId: 'milestone-1',
        title: 'Fund taxi',
        categoryId: null,
        amount: 100,
        currency: 'VND',
        paymentSourceType: 'fund',
        paidByMemberId: null,
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

  it('blocks expense creation that violates the payment source invariant', async () => {
    const db = testEnv.authenticatedContext('editor-user').firestore();
    const basePayload = {
      planId: 'plan-1',
      milestoneId: 'milestone-1',
      title: 'Invalid source',
      categoryId: null,
      amount: 100,
      currency: 'VND',
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
    };

    await assertFails(
      setDoc(doc(db, 'plans', 'plan-1', 'expenses', 'expense-fund-with-payer'), {
        ...basePayload,
        id: 'expense-fund-with-payer',
        paymentSourceType: 'fund',
        paidByMemberId: 'member-editor',
      }),
    );

    await assertFails(
      setDoc(doc(db, 'plans', 'plan-1', 'expenses', 'expense-member-without-payer'), {
        ...basePayload,
        id: 'expense-member-without-payer',
        paymentSourceType: 'member',
        paidByMemberId: null,
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

  it('allows editor to switch their own expense from member-paid to fund-paid', async () => {
    const db = testEnv.authenticatedContext('editor-user').firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'plans', 'plan-1', 'expenses', 'expense-editor'), {
        paymentSourceType: 'fund',
        paidByMemberId: null,
        updatedAt: now,
        version: 2,
      }),
    );
  });

  it('allows a member with finance=manage_all to edit someone else expense', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'plans', 'plan-1', 'members', 'member-editor'), {
        permissions: { moduleAccess: { finance: 'manage_all' } },
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

  it('blocks expense writes that reference a milestone outside the plan', async () => {
    const db = testEnv.authenticatedContext('editor-user').firestore();
    await assertFails(
      setDoc(doc(db, 'plans', 'plan-1', 'expenses', 'expense-invalid-milestone'), {
        id: 'expense-invalid-milestone',
        planId: 'plan-1',
        milestoneId: 'milestone-missing',
        title: 'Taxi',
        categoryId: null,
        amount: 100,
        currency: 'VND',
        paymentSourceType: 'member',
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

  it('allows owner to create a milestone and blocks editor from doing so', async () => {
    const ownerDb = testEnv.authenticatedContext('owner-user').firestore();
    await assertSucceeds(
      setDoc(doc(ownerDb, 'plans', 'plan-1', 'milestones', 'milestone-2'), {
        id: 'milestone-2',
        planId: 'plan-1',
        title: 'Prepare transport',
        description: null,
        iconId: null,
        isSystemHidden: false,
        startDate: null,
        endDate: null,
        status: 'upcoming',
        orderIndex: 1,
        budgetAmount: null,
        totalExpense: 0,
        todoCount: 0,
        completedTodoCount: 0,
        createdByUserId: 'owner-user',
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        cancelledAt: null,
      }),
    );

    const editorDb = testEnv.authenticatedContext('editor-user').firestore();
    await assertFails(
      setDoc(doc(editorDb, 'plans', 'plan-1', 'milestones', 'milestone-3'), {
        id: 'milestone-3',
        planId: 'plan-1',
        title: 'Illegal milestone',
        description: null,
        iconId: null,
        isSystemHidden: false,
        startDate: null,
        endDate: null,
        status: 'upcoming',
        orderIndex: 2,
        budgetAmount: null,
        totalExpense: 0,
        todoCount: 0,
        completedTodoCount: 0,
        createdByUserId: 'editor-user',
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        cancelledAt: null,
      }),
    );
  });

  it('allows owner to create todo for an existing milestone and blocks invalid milestone relation', async () => {
    const db = testEnv.authenticatedContext('owner-user').firestore();
    await assertSucceeds(
      setDoc(doc(db, 'plans', 'plan-1', 'todos', 'todo-2'), {
        id: 'todo-2',
        planId: 'plan-1',
        milestoneId: 'milestone-1',
        title: 'Call supplier',
        description: null,
        assigneeMemberId: 'member-owner',
        dueDate: null,
        priority: 'medium',
        status: 'todo',
        createdByUserId: 'owner-user',
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        cancelledAt: null,
      }),
    );

    await assertFails(
      setDoc(doc(db, 'plans', 'plan-1', 'todos', 'todo-invalid'), {
        id: 'todo-invalid',
        planId: 'plan-1',
        milestoneId: 'milestone-missing',
        title: 'Broken relation',
        description: null,
        assigneeMemberId: 'member-owner',
        dueDate: null,
        priority: 'medium',
        status: 'todo',
        createdByUserId: 'owner-user',
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        cancelledAt: null,
      }),
    );
  });

  it('blocks owner from editing or deleting a hidden milestone directly', async () => {
    const db = testEnv.authenticatedContext('owner-user').firestore();

    await assertFails(
      updateDoc(doc(db, 'plans', 'plan-1', 'milestones', 'milestone-hidden'), {
        title: 'Should not edit hidden milestone',
        updatedAt: now,
      }),
    );

    await assertFails(
      deleteDoc(doc(db, 'plans', 'plan-1', 'milestones', 'milestone-hidden')),
    );
  });

  it('blocks owner from creating todo under a hidden milestone', async () => {
    const db = testEnv.authenticatedContext('owner-user').firestore();

    await assertFails(
      setDoc(doc(db, 'plans', 'plan-1', 'todos', 'todo-hidden'), {
        id: 'todo-hidden',
        planId: 'plan-1',
        milestoneId: 'milestone-hidden',
        title: 'Hidden todo',
        description: null,
        assigneeMemberId: 'member-owner',
        dueDate: null,
        priority: 'medium',
        status: 'todo',
        createdByUserId: 'owner-user',
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        cancelledAt: null,
      }),
    );
  });

  it('allows editor (default planning=manage_own) to create and edit their own todo, but not someone else todo', async () => {
    const db = testEnv.authenticatedContext('editor-user').firestore();

    await assertSucceeds(
      setDoc(doc(db, 'plans', 'plan-1', 'todos', 'todo-editor-owned'), {
        id: 'todo-editor-owned',
        planId: 'plan-1',
        milestoneId: 'milestone-1',
        title: 'Editor task',
        description: null,
        assigneeMemberId: 'member-editor',
        dueDate: null,
        priority: 'medium',
        status: 'todo',
        createdByUserId: 'editor-user',
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        cancelledAt: null,
      }),
    );

    await assertSucceeds(
      updateDoc(doc(db, 'plans', 'plan-1', 'todos', 'todo-editor-owned'), {
        title: 'Editor task updated',
        updatedAt: now,
      }),
    );

    await assertFails(
      updateDoc(doc(db, 'plans', 'plan-1', 'todos', 'todo-1'), {
        title: 'Illegal edit of owner todo',
        updatedAt: now,
      }),
    );
  });

  it('lets an editor with planning=manage_all manage milestones and todos created by others', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'plans', 'plan-1', 'members', 'member-editor'), {
        permissions: { moduleAccess: { planning: 'manage_all' } },
      });
    });

    const db = testEnv.authenticatedContext('editor-user').firestore();

    await assertSucceeds(
      updateDoc(doc(db, 'plans', 'plan-1', 'todos', 'todo-1'), {
        title: 'Delegated todo edit',
        updatedAt: now,
      }),
    );

    await assertSucceeds(
      setDoc(doc(db, 'plans', 'plan-1', 'milestones', 'milestone-editor-manage-all'), {
        id: 'milestone-editor-manage-all',
        planId: 'plan-1',
        title: 'Delegated milestone',
        description: null,
        iconId: null,
        isSystemHidden: false,
        startDate: null,
        endDate: null,
        status: 'upcoming',
        orderIndex: 3,
        budgetAmount: null,
        totalExpense: 0,
        todoCount: 0,
        completedTodoCount: 0,
        createdByUserId: 'editor-user',
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        cancelledAt: null,
      }),
    );
  });

  it('allows a member with finance=manage_all to edit someone else income too', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'plans', 'plan-1', 'members', 'member-editor'), {
        permissions: { moduleAccess: { finance: 'manage_all' } },
      });
    });

    const db = testEnv.authenticatedContext('editor-user').firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'plans', 'plan-1', 'incomes', 'income-owner'), {
        title: 'Delegated income edit',
        updatedAt: now,
        version: 2,
      }),
    );
  });

  it('lets the owner hide a module for an editor, blocking their previously-default write access', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'plans', 'plan-1', 'members', 'member-editor'), {
        permissions: { moduleAccess: { finance: 'hidden' } },
      });
    });

    const db = testEnv.authenticatedContext('editor-user').firestore();
    await assertFails(
      updateDoc(doc(db, 'plans', 'plan-1', 'expenses', 'expense-editor'), {
        title: 'Should be blocked once finance is hidden',
        updatedAt: now,
        version: 2,
      }),
    );
  });

  it('allows a member to refresh their own non-custom nickname', async () => {
    const db = testEnv.authenticatedContext('editor-user').firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'plans', 'plan-1', 'members', 'member-editor'), {
        nickname: 'Renamed Editor',
        updatedAt: now,
      }),
    );
  });

  it('blocks a member from refreshing their nickname once it has been customized', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'plans', 'plan-1', 'members', 'member-editor'), {
        nicknameIsCustom: true,
      });
    });

    const db = testEnv.authenticatedContext('editor-user').firestore();
    await assertFails(
      updateDoc(doc(db, 'plans', 'plan-1', 'members', 'member-editor'), {
        nickname: 'Should not apply',
        updatedAt: now,
      }),
    );
  });

  it('blocks a user from refreshing another member nickname via the self-service branch', async () => {
    const db = testEnv.authenticatedContext('viewer-user').firestore();
    await assertFails(
      updateDoc(doc(db, 'plans', 'plan-1', 'members', 'member-editor'), {
        nickname: 'Hijacked',
        updatedAt: now,
      }),
    );
  });

  it('allows owner to customize an editor nickname via the Member panel', async () => {
    const db = testEnv.authenticatedContext('owner-user').firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'plans', 'plan-1', 'members', 'member-editor'), {
        nickname: 'Custom Nickname',
        nicknameIsCustom: true,
        role: 'editor',
        updatedAt: now,
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
        permissions: { moduleAccess: {} },
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
        paymentSourceType: 'member',
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

  it('allows editor to edit their own income but not someone else income', async () => {
    const db = testEnv.authenticatedContext('editor-user').firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'plans', 'plan-1', 'incomes', 'income-editor'), {
        title: 'Updated Hoan tien',
        updatedAt: now,
        version: 2,
      }),
    );
    await assertFails(
      updateDoc(doc(db, 'plans', 'plan-1', 'incomes', 'income-owner'), {
        title: 'Illegal edit',
        updatedAt: now,
        version: 2,
      }),
    );
  });

  it('allows finance create and update when plan uses a hidden milestone', async () => {
    const db = testEnv.authenticatedContext('editor-user').firestore();

    await assertSucceeds(
      setDoc(doc(db, 'plans', 'plan-2', 'expenses', 'expense-hidden-new'), {
        id: 'expense-hidden-new',
        planId: 'plan-2',
        milestoneId: 'milestone-hidden-debt',
        title: 'Debt fee',
        categoryId: null,
        amount: 60,
        currency: 'VND',
        paymentSourceType: 'member',
        paidByMemberId: 'member-editor-2',
        participants: [],
        splitMethod: 'equal',
        merchantName: null,
        locationName: null,
        note: null,
        attachments: [],
        spentAt: now,
        createdByUserId: 'editor-user',
        createdByMemberId: 'member-editor-2',
        createdAt: now,
        updatedAt: now,
        status: 'active',
        deletedAt: null,
        deletedByUserId: null,
        version: 1,
      }),
    );

    await assertSucceeds(
      updateDoc(doc(db, 'plans', 'plan-2', 'expenses', 'expense-hidden'), {
        title: 'Repayment updated',
        updatedAt: now,
        version: 2,
      }),
    );

    await assertSucceeds(
      updateDoc(doc(db, 'plans', 'plan-2', 'incomes', 'income-hidden'), {
        title: 'Disbursement updated',
        updatedAt: now,
        version: 2,
      }),
    );
  });

  it('blocks income update when plan is closed', async () => {
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
      updateDoc(doc(db, 'plans', 'plan-1', 'incomes', 'income-editor'), {
        title: 'Late edit',
        updatedAt: now,
        version: 2,
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

  it('allows a non-owner plan member to sync estimatedAmount into another member userPlans doc', async () => {
    const db = testEnv.authenticatedContext('editor-user').firestore();
    await assertSucceeds(
      updateDoc(doc(db, 'userPlans', 'owner-user', 'plans', 'plan-1'), {
        estimatedAmount: 2500,
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

  it('allows anyone with the link to get a single pending invitation but not list all invitations', async () => {
    const db = testEnv.authenticatedContext('outsider-user').firestore();
    await assertSucceeds(getDoc(doc(db, 'plans', 'plan-1', 'invitations', 'invite-link')));
    await assertFails(getDocs(collection(db, 'plans', 'plan-1', 'invitations')));
  });

  it('allows a signed-in user to accept an open invite link, creating their own member + userPlans atomically', async () => {
    const db = testEnv.authenticatedContext('newcomer-user', { email: 'newcomer@example.com' }).firestore();
    const memberRef = doc(collection(db, 'plans', 'plan-1', 'members'));
    const batch = writeBatch(db);

    batch.set(memberRef, {
      id: memberRef.id,
      planId: 'plan-1',
      memberType: 'registered',
      userId: 'newcomer-user',
      email: 'newcomer@example.com',
      nickname: 'Newcomer',
      nicknameIsCustom: false,
      invitationId: 'invite-link',
      avatarUrl: null,
      role: 'viewer',
      permissions: { moduleAccess: {} },
      status: 'active',
      invitedAt: null,
      joinedAt: now,
      removedAt: null,
      createdByUserId: 'newcomer-user',
      createdAt: now,
      updatedAt: now,
    });
    batch.set(doc(db, 'userPlans', 'newcomer-user', 'plans', 'plan-1'), {
      id: 'plan-1',
      planId: 'plan-1',
      userId: 'newcomer-user',
      planName: 'Trip',
      planType: 'travel',
      role: 'viewer',
      memberId: memberRef.id,
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
    batch.update(doc(db, 'plans', 'plan-1', 'invitations', 'invite-link'), {
      status: 'accepted',
      acceptedAt: now,
      acceptedByUserId: 'newcomer-user',
      updatedAt: now,
    });

    await assertSucceeds(batch.commit());
  });

  it('blocks accepting an invitation with a role that does not match the invitation', async () => {
    const db = testEnv.authenticatedContext('newcomer2-user', { email: 'newcomer2@example.com' }).firestore();
    const memberRef = doc(collection(db, 'plans', 'plan-1', 'members'));

    await assertFails(
      setDoc(memberRef, {
        id: memberRef.id,
        planId: 'plan-1',
        memberType: 'registered',
        userId: 'newcomer2-user',
        email: 'newcomer2@example.com',
        nickname: 'Newcomer2',
        nicknameIsCustom: false,
        invitationId: 'invite-link',
        avatarUrl: null,
        role: 'editor',
        permissions: { moduleAccess: {} },
        status: 'active',
        invitedAt: null,
        joinedAt: now,
        removedAt: null,
        createdByUserId: 'newcomer2-user',
        createdAt: now,
        updatedAt: now,
      }),
    );
  });

  it('blocks accepting an expired invitation', async () => {
    const db = testEnv.authenticatedContext('newcomer3-user', { email: 'newcomer3@example.com' }).firestore();
    const memberRef = doc(collection(db, 'plans', 'plan-1', 'members'));

    await assertFails(
      setDoc(memberRef, {
        id: memberRef.id,
        planId: 'plan-1',
        memberType: 'registered',
        userId: 'newcomer3-user',
        email: 'newcomer3@example.com',
        nickname: 'Newcomer3',
        nicknameIsCustom: false,
        invitationId: 'invite-expired',
        avatarUrl: null,
        role: 'viewer',
        permissions: { moduleAccess: {} },
        status: 'active',
        invitedAt: null,
        joinedAt: now,
        removedAt: null,
        createdByUserId: 'newcomer3-user',
        createdAt: now,
        updatedAt: now,
      }),
    );
  });

  it('blocks accepting an email-restricted invitation with a mismatched account email', async () => {
    const db = testEnv.authenticatedContext('wronguser', { email: 'wrong@example.com' }).firestore();
    const memberRef = doc(collection(db, 'plans', 'plan-1', 'members'));

    await assertFails(
      setDoc(memberRef, {
        id: memberRef.id,
        planId: 'plan-1',
        memberType: 'registered',
        userId: 'wronguser',
        email: 'wrong@example.com',
        nickname: 'Wrong',
        nicknameIsCustom: false,
        invitationId: 'invite-email',
        avatarUrl: null,
        role: 'editor',
        permissions: { moduleAccess: {} },
        status: 'active',
        invitedAt: null,
        joinedAt: now,
        removedAt: null,
        createdByUserId: 'wronguser',
        createdAt: now,
        updatedAt: now,
      }),
    );
  });

  it('allows owner to revoke a pending invitation but blocks a non-owner from doing so', async () => {
    const ownerDb = testEnv.authenticatedContext('owner-user').firestore();
    await assertSucceeds(
      updateDoc(doc(ownerDb, 'plans', 'plan-1', 'invitations', 'invite-email'), {
        status: 'revoked',
        revokedAt: now,
        revokedByUserId: 'owner-user',
        updatedAt: now,
      }),
    );

    const editorDb = testEnv.authenticatedContext('editor-user').firestore();
    await assertFails(
      updateDoc(doc(editorDb, 'plans', 'plan-1', 'invitations', 'invite-link'), {
        status: 'revoked',
        revokedAt: now,
        revokedByUserId: 'editor-user',
        updatedAt: now,
      }),
    );
  });

  it('allows owner to unlink an accepted member account, but blocks a non-owner', async () => {
    const editorDb = testEnv.authenticatedContext('editor-user').firestore();
    await assertFails(
      Promise.all([
        updateDoc(doc(editorDb, 'plans', 'plan-1', 'members', 'member-viewer'), {
          userId: null,
          memberType: 'guest',
          email: null,
          updatedAt: now,
        }),
        deleteDoc(doc(editorDb, 'userPlans', 'viewer-user', 'plans', 'plan-1')),
      ]),
    );

    const ownerDb = testEnv.authenticatedContext('owner-user').firestore();
    await assertSucceeds(
      updateDoc(doc(ownerDb, 'plans', 'plan-1', 'members', 'member-viewer'), {
        userId: null,
        memberType: 'guest',
        email: null,
        updatedAt: now,
      }),
    );
    await assertSucceeds(deleteDoc(doc(ownerDb, 'userPlans', 'viewer-user', 'plans', 'plan-1')));
  });

  it('allows claiming an existing guest via a matching claim-invitation, preserving memberId', async () => {
    const db = testEnv.authenticatedContext('claimer-user', { email: 'claimer@example.com' }).firestore();
    const memberRef = doc(db, 'plans', 'plan-1', 'members', 'member-guest');
    const batch = writeBatch(db);

    batch.update(memberRef, {
      memberType: 'registered',
      userId: 'claimer-user',
      email: 'claimer@example.com',
      invitationId: 'invite-claim',
      updatedAt: now,
    });
    batch.set(doc(db, 'userPlans', 'claimer-user', 'plans', 'plan-1'), {
      id: 'plan-1',
      planId: 'plan-1',
      userId: 'claimer-user',
      planName: 'Trip',
      planType: 'travel',
      role: 'viewer',
      memberId: 'member-guest',
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
    batch.update(doc(db, 'plans', 'plan-1', 'invitations', 'invite-claim'), {
      status: 'accepted',
      acceptedAt: now,
      acceptedByUserId: 'claimer-user',
      updatedAt: now,
    });

    await assertSucceeds(batch.commit());
  });

  it('blocks replaying a claim-invitation through the plain new-member create branch', async () => {
    const db = testEnv.authenticatedContext('hijacker-user', { email: 'hijacker@example.com' }).firestore();
    const memberRef = doc(collection(db, 'plans', 'plan-1', 'members'));

    await assertFails(
      setDoc(memberRef, {
        id: memberRef.id,
        planId: 'plan-1',
        memberType: 'registered',
        userId: 'hijacker-user',
        email: 'hijacker@example.com',
        nickname: 'Hijacker',
        nicknameIsCustom: false,
        invitationId: 'invite-claim',
        avatarUrl: null,
        role: 'viewer',
        permissions: { moduleAccess: {} },
        status: 'active',
        invitedAt: null,
        joinedAt: now,
        removedAt: null,
        createdByUserId: 'hijacker-user',
        createdAt: now,
        updatedAt: now,
      }),
    );
  });

  it('blocks claiming a guest that has already been linked to an account', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'plans', 'plan-1', 'members', 'member-guest'), {
        memberType: 'registered',
        userId: 'already-linked-user',
      });
    });

    const db = testEnv.authenticatedContext('claimer2-user', { email: 'claimer2@example.com' }).firestore();
    await assertFails(
      updateDoc(doc(db, 'plans', 'plan-1', 'members', 'member-guest'), {
        memberType: 'registered',
        userId: 'claimer2-user',
        email: 'claimer2@example.com',
        invitationId: 'invite-claim',
        updatedAt: now,
      }),
    );
  });

  it("blocks claiming a guest whose id doesn't match the invitation's targetMemberId", async () => {
    const db = testEnv.authenticatedContext('claimer3-user', { email: 'claimer3@example.com' }).firestore();
    await assertFails(
      updateDoc(doc(db, 'plans', 'plan-1', 'members', 'member-guest-2'), {
        memberType: 'registered',
        userId: 'claimer3-user',
        email: 'claimer3@example.com',
        invitationId: 'invite-claim',
        updatedAt: now,
      }),
    );
  });

  describe('debtTransactions (native_debt)', () => {
    function debtTransaction(overrides: Record<string, unknown> = {}) {
      return {
        id: 'debt-transaction-1',
        planId: 'plan-2',
        counterpartyMemberId: 'member-editor-2',
        direction: 'receivable',
        type: 'loan',
        amount: 10_000_000,
        occurredAt: now,
        dueDate: null,
        note: null,
        attachments: [],
        createdByUserId: 'owner-user',
        createdByMemberId: 'member-owner-2',
        createdAt: now,
        updatedAt: now,
        ...overrides,
      };
    }

    it('allows the plan owner to create a debt transaction', async () => {
      const db = testEnv.authenticatedContext('owner-user').firestore();
      await assertSucceeds(
        setDoc(doc(db, 'plans', 'plan-2', 'debtTransactions', 'debt-transaction-1'), debtTransaction()),
      );
    });

    it('blocks an editor from creating a debt transaction', async () => {
      const db = testEnv.authenticatedContext('editor-user').firestore();
      await assertFails(
        setDoc(
          doc(db, 'plans', 'plan-2', 'debtTransactions', 'debt-transaction-editor'),
          debtTransaction({
            id: 'debt-transaction-editor',
            createdByUserId: 'editor-user',
            createdByMemberId: 'member-editor-2',
          }),
        ),
      );
    });

    it('blocks a debt transaction whose counterparty belongs to a different plan', async () => {
      const db = testEnv.authenticatedContext('owner-user').firestore();
      await assertFails(
        setDoc(
          doc(db, 'plans', 'plan-2', 'debtTransactions', 'debt-transaction-cross-plan'),
          debtTransaction({ id: 'debt-transaction-cross-plan', counterpartyMemberId: 'member-owner' }),
        ),
      );
    });

    it('allows editing amount/note but blocks changing direction, type, or counterparty', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(
          doc(context.firestore(), 'plans', 'plan-2', 'debtTransactions', 'debt-transaction-edit'),
          debtTransaction({ id: 'debt-transaction-edit' }),
        );
      });

      const db = testEnv.authenticatedContext('owner-user').firestore();
      await assertSucceeds(
        updateDoc(doc(db, 'plans', 'plan-2', 'debtTransactions', 'debt-transaction-edit'), {
          amount: 12_000_000,
          note: 'Adjusted amount',
          updatedAt: now,
        }),
      );
      await assertFails(
        updateDoc(doc(db, 'plans', 'plan-2', 'debtTransactions', 'debt-transaction-edit'), {
          direction: 'payable',
          updatedAt: now,
        }),
      );
      await assertFails(
        updateDoc(doc(db, 'plans', 'plan-2', 'debtTransactions', 'debt-transaction-edit'), {
          type: 'repayment',
          updatedAt: now,
        }),
      );
      await assertFails(
        updateDoc(doc(db, 'plans', 'plan-2', 'debtTransactions', 'debt-transaction-edit'), {
          counterpartyMemberId: 'member-owner-2',
          updatedAt: now,
        }),
      );
    });

    it('allows the owner to delete a debt transaction but blocks an editor', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(
          doc(context.firestore(), 'plans', 'plan-2', 'debtTransactions', 'debt-transaction-delete'),
          debtTransaction({ id: 'debt-transaction-delete' }),
        );
      });

      const editorDb = testEnv.authenticatedContext('editor-user').firestore();
      await assertFails(deleteDoc(doc(editorDb, 'plans', 'plan-2', 'debtTransactions', 'debt-transaction-delete')));

      const ownerDb = testEnv.authenticatedContext('owner-user').firestore();
      await assertSucceeds(deleteDoc(doc(ownerDb, 'plans', 'plan-2', 'debtTransactions', 'debt-transaction-delete')));
    });

    it('blocks debt transaction creation when the plan is closed', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await updateDoc(doc(context.firestore(), 'plans', 'plan-2'), {
          status: 'closed',
          closedAt: now,
        });
        await updateDoc(doc(context.firestore(), 'userPlans', 'owner-user', 'plans', 'plan-2'), {
          planStatus: 'closed',
        });
      });

      const db = testEnv.authenticatedContext('owner-user').firestore();
      await assertFails(
        setDoc(doc(db, 'plans', 'plan-2', 'debtTransactions', 'debt-transaction-closed'), debtTransaction({ id: 'debt-transaction-closed' })),
      );
    });
  });

  it('blocks changing debtModel through the edit-plan-details update path', async () => {
    const db = testEnv.authenticatedContext('owner-user').firestore();
    await assertFails(
      updateDoc(doc(db, 'plans', 'plan-2'), {
        name: 'Debt Plan',
        description: null,
        planType: 'debt',
        debtModel: 'native_debt',
        status: 'active',
        startDate: null,
        endDate: null,
        budgetAmount: null,
        savingGoalAmount: null,
        savingTargetDate: null,
        closedAt: null,
        archivedAt: null,
        updatedAt: now,
      }),
    );
  });

  describe('settlements', () => {
    const baseSettlement = {
      planId: 'plan-1',
      amount: 100,
      currency: 'VND',
      note: null,
      attachments: [],
      settledAt: now,
      status: 'completed',
      createdByUserId: 'owner-user',
      createdByMemberId: 'member-owner',
      createdAt: now,
      updatedAt: now,
      cancelledAt: null,
      cancelledByUserId: null,
      version: 1,
    };

    it('allows creating a member-to-member settlement', async () => {
      const db = testEnv.authenticatedContext('owner-user').firestore();
      await assertSucceeds(
        setDoc(doc(db, 'plans', 'plan-1', 'settlements', 'settlement-member'), {
          ...baseSettlement,
          id: 'settlement-member',
          fromMemberId: 'member-editor',
          toMemberId: 'member-owner',
        }),
      );
    });

    it('blocks a settlement where fromMemberId equals toMemberId', async () => {
      const db = testEnv.authenticatedContext('owner-user').firestore();
      await assertFails(
        setDoc(doc(db, 'plans', 'plan-1', 'settlements', 'settlement-same-member'), {
          ...baseSettlement,
          id: 'settlement-same-member',
          fromMemberId: 'member-owner',
          toMemberId: 'member-owner',
        }),
      );
    });

    it('allows cancelling a settlement while keeping fromMemberId/toMemberId unchanged', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'plans', 'plan-1', 'settlements', 'settlement-cancel'), {
          ...baseSettlement,
          id: 'settlement-cancel',
          fromMemberId: 'member-editor',
          toMemberId: 'member-owner',
        });
      });

      const db = testEnv.authenticatedContext('owner-user').firestore();
      await assertSucceeds(
        updateDoc(doc(db, 'plans', 'plan-1', 'settlements', 'settlement-cancel'), {
          status: 'cancelled',
          cancelledByUserId: 'owner-user',
          cancelledAt: now,
        }),
      );
    });

    it('blocks changing fromMemberId while cancelling a settlement', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'plans', 'plan-1', 'settlements', 'settlement-retarget'), {
          ...baseSettlement,
          id: 'settlement-retarget',
          fromMemberId: 'member-editor',
          toMemberId: 'member-owner',
        });
      });

      const db = testEnv.authenticatedContext('owner-user').firestore();
      await assertFails(
        updateDoc(doc(db, 'plans', 'plan-1', 'settlements', 'settlement-retarget'), {
          fromMemberId: 'member-owner',
          status: 'cancelled',
          cancelledByUserId: 'owner-user',
          cancelledAt: now,
        }),
      );
    });
  });

  describe('incomes allocatedToMemberId invariant', () => {
    const baseIncome = {
      planId: 'plan-1',
      milestoneId: 'milestone-1',
      title: 'Nap quy',
      categoryId: null,
      amount: 100,
      currency: 'VND',
      contributedByMemberId: 'member-editor',
      note: null,
      attachments: [],
      receivedAt: now,
      status: 'active',
      createdByUserId: 'editor-user',
      createdByMemberId: 'member-editor',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      deletedByUserId: null,
      version: 1,
    };

    it('allows creating an income with allocatedToMemberId set to null', async () => {
      const db = testEnv.authenticatedContext('editor-user').firestore();
      await assertSucceeds(
        setDoc(doc(db, 'plans', 'plan-1', 'incomes', 'income-unallocated'), {
          ...baseIncome,
          id: 'income-unallocated',
          allocatedToMemberId: null,
        }),
      );
    });

    it('allows creating an income allocated to a member', async () => {
      const db = testEnv.authenticatedContext('editor-user').firestore();
      await assertSucceeds(
        setDoc(doc(db, 'plans', 'plan-1', 'incomes', 'income-allocated'), {
          ...baseIncome,
          id: 'income-allocated',
          allocatedToMemberId: 'member-owner',
        }),
      );
    });
  });
});
