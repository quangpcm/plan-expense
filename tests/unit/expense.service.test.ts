import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import { ExpenseService } from '@/modules/expense/services/expense.service';
import type { ExpenseRepository } from '@/modules/expense/repositories/expense.repository';
import type { CreateExpenseInput, ExpenseDocument, UpdateExpenseInput } from '@/modules/expense/types/expense';

const repositoryStub: ExpenseRepository = {
  generateExpenseId() {
    return 'expense-new';
  },
  async createExpense() {
    return { expenseId: 'expense-new' };
  },
  async updateExpense() {
    return { orphanedAttachments: [] };
  },
  async deleteExpense() {
    return { orphanedAttachments: [] };
  },
  watchExpenses() {
    return () => {};
  },
  watchExpense() {
    return () => {};
  },
};

const plan = {
  id: 'plan-1',
  planType: 'travel',
  status: 'active',
  ownerMemberId: 'member-owner',
} as unknown as Parameters<ExpenseService['createExpense']>[1]['plan'];

const debtPlan = {
  id: 'plan-2',
  planType: 'debt',
  status: 'active',
  ownerMemberId: 'member-owner',
} as unknown as Parameters<ExpenseService['createExpense']>[1]['plan'];

const members = [
  { id: 'member-owner', status: 'active', role: 'owner', permissions: { moduleAccess: {} } },
  { id: 'member-a', status: 'active', role: 'editor', permissions: { moduleAccess: {} } },
  { id: 'member-b', status: 'active', role: 'editor', permissions: { moduleAccess: {} } },
] as unknown as Parameters<ExpenseService['createExpense']>[1]['members'];

const currentMember = members[0]!;
const currentUser = { uid: 'owner-user' } as Parameters<ExpenseService['createExpense']>[1]['currentUser'];
const milestones = [
  { id: 'milestone-1', planId: 'plan-1' },
  { id: 'milestone-2', planId: 'plan-2' },
] as unknown as Parameters<ExpenseService['createExpense']>[1]['milestones'];

function makeContext(overrides: Partial<Parameters<ExpenseService['createExpense']>[1]> = {}) {
  return {
    plan,
    members,
    milestones,
    currentMember,
    currentUser,
    categories: [],
    expenses: [],
    incomes: [],
    ...overrides,
  };
}

function makeExpense(overrides: Partial<ExpenseDocument> = {}): ExpenseDocument {
  return {
    id: 'expense-1',
    planId: 'plan-1',
    milestoneId: 'milestone-1',
    title: 'Hotel',
    categoryId: null,
    amount: 1000000,
    currency: 'VND',
    paymentSourceType: 'fund',
    paidByMemberId: null,
    participants: [{ memberId: 'member-a', amount: 1000000, percentage: null, shares: 1 }],
    splitMethod: 'equal',
    merchantName: null,
    locationName: null,
    note: null,
    attachments: [],
    spentAt: Timestamp.now(),
    createdByUserId: 'owner-user',
    createdByMemberId: 'member-owner',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    status: 'active',
    deletedAt: null,
    deletedByUserId: null,
    version: 1,
    ...overrides,
  };
}

function makeCreateInput(overrides: Partial<CreateExpenseInput> = {}): CreateExpenseInput {
  return {
    title: 'Taxi',
    amount: 100000,
    milestoneId: 'milestone-1',
    paymentSourceType: 'fund',
    paidByMemberId: null,
    participantMemberIds: ['member-a'],
    splitMethod: 'equal',
    attachments: [],
    ...overrides,
  };
}

function makeUpdateInput(overrides: Partial<UpdateExpenseInput> = {}): UpdateExpenseInput {
  return {
    expenseId: 'expense-1',
    title: 'Hotel',
    amount: 1000000,
    milestoneId: 'milestone-1',
    paymentSourceType: 'fund',
    paidByMemberId: null,
    participantMemberIds: ['member-a'],
    splitMethod: 'equal',
    attachments: [],
    ...overrides,
  };
}

describe('ExpenseService fund payment source', () => {
  const service = new ExpenseService(repositoryStub);

  it('FUND-04: rejects creating a fund-paid expense that exceeds the fund balance', async () => {
    await expect(
      service.createExpense(
        makeCreateInput({ amount: 150 }),
        makeContext({ incomes: [{ amount: 100, status: 'active', allocatedToMemberId: null } as never] }),
      ),
    ).rejects.toThrow('Quỹ chung không đủ');
  });

  it('FUND-05: allows creating a fund-paid expense exactly equal to the fund balance', async () => {
    await expect(
      service.createExpense(
        makeCreateInput({ amount: 100 }),
        makeContext({ incomes: [{ amount: 100, status: 'active', allocatedToMemberId: null } as never] }),
      ),
    ).resolves.toEqual({ expenseId: 'expense-new' });
  });

  it('FUND-06: recalculates projected fund balance by restoring the edited expense first', async () => {
    // Fund runtime balance is currently 500,000 (income 1,500,000 minus this
    // very fund expense of 1,000,000). Editing it up to 1,300,000 must restore
    // the 1,000,000 first: 500,000 + 1,000,000 - 1,300,000 = 200,000 (valid).
    const existing = makeExpense({ amount: 1000000 });
    const context = makeContext({
      incomes: [{ amount: 1500000, status: 'active', allocatedToMemberId: null } as never],
      expenses: [existing],
    });

    await expect(
      service.updateExpense(makeUpdateInput({ amount: 1300000 }), context, existing),
    ).resolves.toBeUndefined();

    await expect(
      service.updateExpense(makeUpdateInput({ amount: 1600000 }), context, existing),
    ).rejects.toThrow('Quỹ chung không đủ');
  });

  it('FUND-07: rejects switching a member-paid expense to fund-paid when the fund cannot cover it', async () => {
    const existing = makeExpense({
      amount: 200,
      paymentSourceType: 'member',
      paidByMemberId: 'member-a',
    });
    const context = makeContext({
      incomes: [{ amount: 100, status: 'active', allocatedToMemberId: null } as never],
      expenses: [existing],
    });

    await expect(
      service.updateExpense(
        makeUpdateInput({ amount: 200, paymentSourceType: 'fund', paidByMemberId: null }),
        context,
        existing,
      ),
    ).rejects.toThrow('Quỹ chung không đủ');
  });

  it('FUND-08: always allows switching a fund-paid expense back to member-paid', async () => {
    const existing = makeExpense({ amount: 500, paymentSourceType: 'fund', paidByMemberId: null });
    // Fund balance is fully exhausted (income 500, this fund expense is 500) —
    // switching away from fund must not require any fund availability check.
    const context = makeContext({
      incomes: [{ amount: 500, status: 'active', allocatedToMemberId: null } as never],
      expenses: [existing],
    });

    await expect(
      service.updateExpense(
        makeUpdateInput({ amount: 500, paymentSourceType: 'member', paidByMemberId: 'member-a' }),
        context,
        existing,
      ),
    ).resolves.toBeUndefined();
  });

  it('rejects a fund-paid expense in debt-mode plans', async () => {
    await expect(
      service.createExpense(
        makeCreateInput({ milestoneId: 'milestone-2', participantMemberIds: ['member-a'] }),
        makeContext({ plan: debtPlan, incomes: [{ amount: 100000, status: 'active', allocatedToMemberId: null } as never] }),
      ),
    ).rejects.toThrow('quỹ chung');
  });
});
