import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import { IncomeService } from '@/modules/income/services/income.service';
import type { ExpenseDocument } from '@/modules/expense/types/expense';
import type { IncomeRepository } from '@/modules/income/repositories/income.repository';
import type { CreateIncomeInput, IncomeDocument, UpdateIncomeInput } from '@/modules/income/types/income';

function makeFundExpense(overrides: Partial<ExpenseDocument> = {}): ExpenseDocument {
  return {
    id: 'expense-fund-1',
    planId: 'plan-1',
    milestoneId: 'milestone-1',
    title: 'Hotel from fund',
    categoryId: null,
    amount: 450,
    currency: 'VND',
    paymentSourceType: 'fund',
    paidByMemberId: null,
    participants: [],
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

const repositoryStub: IncomeRepository = {
  async createIncome() {
    return { incomeId: 'income-new' };
  },
  async updateIncome() {},
  async softDeleteIncome() {},
  watchIncomes() {
    return () => {};
  },
  watchIncome() {
    return () => {};
  },
};

const plan = {
  id: 'plan-1',
  planType: 'travel',
  status: 'active',
  ownerMemberId: 'member-owner',
} as unknown as Parameters<IncomeService['updateIncome']>[1]['plan'];

const members = [
  { id: 'member-owner', status: 'active', role: 'owner', permissions: { moduleAccess: {} } },
  { id: 'member-a', status: 'active', role: 'editor', permissions: { moduleAccess: {} } },
] as unknown as Parameters<IncomeService['updateIncome']>[1]['members'];

const currentMember = members[0]!;
const currentUser = { uid: 'owner-user' } as Parameters<IncomeService['updateIncome']>[1]['currentUser'];
const milestones = [
  { id: 'milestone-1', planId: 'plan-1' },
] as unknown as Parameters<IncomeService['updateIncome']>[1]['milestones'];

function makeIncome(overrides: Partial<IncomeDocument> = {}): IncomeDocument {
  return {
    id: 'income-1',
    planId: 'plan-1',
    milestoneId: 'milestone-1',
    title: 'Nap quy',
    categoryId: null,
    amount: 500,
    currency: 'VND',
    contributedByMemberId: 'member-a',
    allocatedToMemberId: null,
    note: null,
    attachments: [],
    receivedAt: Timestamp.now(),
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

function makeUpdateInput(overrides: Partial<UpdateIncomeInput> = {}): UpdateIncomeInput {
  return {
    incomeId: 'income-1',
    title: 'Nap quy',
    amount: 100,
    milestoneId: 'milestone-1',
    contributedByMemberId: 'member-a',
    allocatedToMemberId: null,
    ...overrides,
  };
}

function makeContext(overrides: Partial<Parameters<IncomeService['updateIncome']>[1]> = {}) {
  return {
    plan,
    members,
    currentMember,
    currentUser,
    categories: [],
    milestones,
    expenses: [],
    incomes: [],
    ...overrides,
  };
}

describe('IncomeService fund solvency', () => {
  const service = new IncomeService(repositoryStub);

  it('FUND-09: rejects decreasing an income when the fund would go negative', async () => {
    // Unallocated fund is currently 500 - 450 = 50 (fund-paid expense already spent most of it).
    // Reducing the income from 500 to 100 would need the fund to have covered
    // 450 out of only 100, which is insolvent.
    const existing = makeIncome({ amount: 500 });
    const fundExpense = makeFundExpense({ amount: 450 });

    await expect(
      service.updateIncome(
        makeUpdateInput({ amount: 100 }),
        makeContext({ incomes: [existing], expenses: [fundExpense] }),
        existing,
      ),
    ).rejects.toThrow('Không thể lưu thay đổi này');
  });

  it('allows decreasing an income when the fund still stays solvent', async () => {
    const existing = makeIncome({ amount: 500 });
    const other = makeIncome({ id: 'income-2', amount: 1000 });

    await expect(
      service.updateIncome(makeUpdateInput({ amount: 100 }), makeContext({ incomes: [existing, other] }), existing),
    ).resolves.toBeUndefined();
  });

  it('never blocks increasing an income amount', async () => {
    const existing = makeIncome({ amount: 100 });

    await expect(
      service.updateIncome(makeUpdateInput({ amount: 5000 }), makeContext({ incomes: [existing] }), existing),
    ).resolves.toBeUndefined();
  });

  it('FUND-10: rejects deleting an income when the fund would go negative', async () => {
    const existing = makeIncome({ amount: 500 });
    const fundExpense = makeFundExpense({ amount: 450 });

    await expect(
      service.deleteIncome(plan, existing, currentUser, currentMember, {
        expenses: [fundExpense],
        incomes: [existing],
      }),
    ).rejects.toThrow('Không thể lưu thay đổi này');
  });

  it('allows deleting an income when other funds remain sufficient', async () => {
    const existing = makeIncome({ amount: 500 });
    const other = makeIncome({ id: 'income-2', amount: 1000 });

    await expect(
      service.deleteIncome(plan, existing, currentUser, currentMember, {
        expenses: [],
        incomes: [existing, other],
      }),
    ).resolves.toBeUndefined();
  });

  it('FUND-ALLOC-03: rejects re-allocating an income from unallocated to a member when a Fund-paid expense depends on it staying unallocated', async () => {
    // Unallocated fund is exactly 450 (matches the fund-paid expense). Re-allocating
    // this income to member-a — without changing its amount — would leave the
    // fund-paid expense with nothing to draw from.
    const existing = makeIncome({ amount: 450, allocatedToMemberId: null });
    const fundExpense = makeFundExpense({ amount: 450 });

    await expect(
      service.updateIncome(
        makeUpdateInput({ amount: 450, allocatedToMemberId: 'member-a' }),
        makeContext({ incomes: [existing], expenses: [fundExpense] }),
        existing,
      ),
    ).rejects.toThrow('Không thể lưu thay đổi này');
  });

  it('allows re-allocating an income when the fund still stays solvent afterwards', async () => {
    const existing = makeIncome({ amount: 450, allocatedToMemberId: null });
    const other = makeIncome({ id: 'income-2', amount: 500, allocatedToMemberId: null });
    const fundExpense = makeFundExpense({ amount: 450 });

    await expect(
      service.updateIncome(
        makeUpdateInput({ amount: 450, allocatedToMemberId: 'member-a' }),
        makeContext({ incomes: [existing, other], expenses: [fundExpense] }),
        existing,
      ),
    ).resolves.toBeUndefined();
  });
});

describe('IncomeService allocation validation', () => {
  const service = new IncomeService(repositoryStub);

  function makeCreateInput(overrides: Partial<CreateIncomeInput> = {}): CreateIncomeInput {
    return {
      title: 'Nap quy',
      amount: 100,
      milestoneId: 'milestone-1',
      contributedByMemberId: 'member-a',
      allocatedToMemberId: 'member-owner',
      ...overrides,
    };
  }

  it('ALLOC-01/02: allows creating an income allocated to an active member', async () => {
    await expect(service.createIncome(makeCreateInput(), makeContext())).resolves.toEqual({
      incomeId: 'income-new',
    });
  });

  it('ALLOC-03: allows creating an income explicitly unallocated', async () => {
    await expect(
      service.createIncome(makeCreateInput({ allocatedToMemberId: null }), makeContext()),
    ).resolves.toEqual({ incomeId: 'income-new' });
  });

  it('rejects allocating an income to a member outside the plan', async () => {
    await expect(
      service.createIncome(makeCreateInput({ allocatedToMemberId: 'member-ghost' }), makeContext()),
    ).rejects.toThrow('không hợp lệ');
  });

  it('rejects updating an income to allocate to a member outside the plan', async () => {
    const existing = makeIncome({ amount: 100 });

    await expect(
      service.updateIncome(
        makeUpdateInput({ amount: 100, allocatedToMemberId: 'member-ghost' }),
        makeContext({ incomes: [existing] }),
        existing,
      ),
    ).rejects.toThrow('không hợp lệ');
  });
});
