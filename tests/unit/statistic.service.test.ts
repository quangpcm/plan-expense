import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import { StatisticService } from '@/modules/statistic/services/statistic.service';
import type { Category } from '@/modules/category/types/category';
import type { ExpenseDocument } from '@/modules/expense/types/expense';
import type { IncomeDocument } from '@/modules/income/types/income';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import type { SettlementDocument } from '@/modules/settlement/types/settlement';

const OWNER = 'owner-x';

function makeMember(id: string, nickname: string): PlanMemberDocument {
  return {
    id,
    planId: 'plan-1',
    memberType: 'registered',
    userId: `${id}-user`,
    email: `${id}@example.com`,
    nickname,
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
    createdByUserId: `${id}-user`,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

function makeExpense(overrides: Partial<ExpenseDocument> = {}): ExpenseDocument {
  return {
    id: 'expense-1',
    planId: 'plan-1',
    milestoneId: 'milestone-1',
    title: 'Dinner',
    categoryId: 'cat-food',
    amount: 300,
    currency: 'VND',
    paymentSourceType: 'member',
    paidByMemberId: 'member-a',
    participants: [
      { memberId: 'member-a', amount: 150, percentage: null, shares: 1 },
      { memberId: 'member-b', amount: 150, percentage: null, shares: 1 },
    ],
    splitMethod: 'equal',
    merchantName: null,
    locationName: null,
    note: null,
    attachments: [],
    spentAt: Timestamp.fromDate(new Date('2026-08-05T10:00:00+07:00')),
    createdByUserId: 'user-a',
    createdByMemberId: 'member-a',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    status: 'active',
    deletedAt: null,
    deletedByUserId: null,
    version: 1,
    ...overrides,
  };
}

function makeMilestone(overrides: Partial<MilestoneDocument> = {}): MilestoneDocument {
  return {
    id: 'milestone-1',
    planId: 'plan-1',
    title: 'Booking',
    description: null,
    iconId: null,
    isSystemHidden: false,
    startDate: null,
    endDate: null,
    status: 'in_progress',
    orderIndex: 0,
    budgetAmount: 1000,
    estimatedAmount: 1000,
    totalExpense: 300,
    todoCount: 2,
    completedTodoCount: 1,
    createdByUserId: 'user-a',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    completedAt: null,
    cancelledAt: null,
    ...overrides,
  };
}

function makeIncome(overrides: Partial<IncomeDocument> = {}): IncomeDocument {
  return {
    id: 'income-1',
    planId: 'plan-1',
    milestoneId: 'milestone-1',
    title: 'Top up',
    categoryId: null,
    amount: 500,
    currency: 'VND',
    contributedByMemberId: 'member-a',
    allocatedToMemberId: null,
    note: null,
    attachments: [],
    receivedAt: Timestamp.now(),
    createdByUserId: 'user-a',
    createdByMemberId: 'member-a',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    status: 'active',
    deletedAt: null,
    deletedByUserId: null,
    version: 1,
    ...overrides,
  };
}

function makeSettlement(overrides: Partial<SettlementDocument> = {}): SettlementDocument {
  return {
    id: 'settlement-1',
    planId: 'plan-1',
    fromMemberId: 'member-b',
    toMemberId: 'member-a',
    amount: 50,
    currency: 'VND',
    note: null,
    attachments: [],
    settledAt: Timestamp.now(),
    status: 'completed',
    createdByUserId: 'user-a',
    createdByMemberId: 'member-a',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    cancelledAt: null,
    cancelledByUserId: null,
    version: 1,
    ...overrides,
  };
}

describe('StatisticService', () => {
  const service = new StatisticService();
  const categories: Category[] = [
    {
      id: 'cat-food',
      name: 'Food',
      icon: 'utensils',
      categoryType: 'expense',
      iconColor: 'text-orange-600',
      iconBgColor: 'bg-orange-100',
    },
  ];

  it('calculates balances, adjusted balances, category totals, and timeline', () => {
    const statistic = service.calculate({
      members: [makeMember('member-a', 'Alice'), makeMember('member-b', 'Bob')],
      expenses: [makeExpense()],
      incomes: [makeIncome()],
      milestones: [makeMilestone()],
      categories,
      settlements: [makeSettlement()],
      ownerMemberId: OWNER,
    });

    expect(statistic.overview).toMatchObject({
      totalExpense: 300,
      memberCount: 2,
      expenseCount: 1,
      averageExpense: 300,
      settledAmount: 50,
      pendingSettlementAmount: 600,
    });
    expect(statistic.memberBalances).toEqual([
      expect.objectContaining({
        memberId: 'member-a',
        paid: 300,
        owed: 150,
        balance: 650,
        totalIncome: 500,
        incomeAllocatedToMember: 0,
        settlementPaid: 0,
        settlementReceived: 50,
        adjustedBalance: 600,
      }),
      expect.objectContaining({
        memberId: 'member-b',
        paid: 0,
        owed: 150,
        balance: -150,
        totalIncome: 0,
        incomeAllocatedToMember: 0,
        settlementPaid: 50,
        settlementReceived: 0,
        adjustedBalance: -100,
      }),
    ]);
    expect(statistic.categoryBreakdown).toEqual([
      {
        categoryId: 'cat-food',
        categoryName: 'Food',
        icon: 'utensils',
        iconColor: 'text-orange-600',
        iconBgColor: 'bg-orange-100',
        totalAmount: 300,
      },
    ]);
    expect(statistic.milestoneBreakdown).toEqual([
      {
        milestoneId: 'milestone-1',
        milestoneTitle: 'Booking',
        status: 'in_progress',
        totalAmount: 300,
        budgetAmount: 1000,
        expenseCount: 1,
        todoCount: 2,
        completedTodoCount: 1,
        progress: 50,
        memberBreakdown: [{ memberId: 'member-a', nickname: 'Alice', totalAmount: 300 }],
      },
    ]);
    expect(statistic.expenseTimeline).toEqual([{ date: '05/08/2026', totalAmount: 300 }]);
  });

  it('keeps milestone-first breakdown stable when some milestones have no expense', () => {
    const statistic = service.calculate({
      members: [makeMember('member-a', 'Alice'), makeMember('member-b', 'Bob')],
      expenses: [
        makeExpense(),
        makeExpense({
          id: 'expense-2',
          milestoneId: 'milestone-2',
          amount: 200,
          participants: [
            { memberId: 'member-a', amount: 100, percentage: null, shares: 1 },
            { memberId: 'member-b', amount: 100, percentage: null, shares: 1 },
          ],
        }),
      ],
      incomes: [makeIncome()],
      milestones: [
        makeMilestone(),
        makeMilestone({
          id: 'milestone-2',
          title: 'Ceremony',
          totalExpense: 200,
          todoCount: 0,
          completedTodoCount: 0,
          budgetAmount: null,
          status: 'upcoming',
        }),
        makeMilestone({
          id: 'milestone-3',
          title: 'After Party',
          totalExpense: 0,
          todoCount: 1,
          completedTodoCount: 0,
          budgetAmount: 500,
          status: 'upcoming',
        }),
      ],
      categories,
      settlements: [makeSettlement()],
      ownerMemberId: OWNER,
    });

    expect(statistic.overview.totalExpense).toBe(500);
    expect(statistic.milestoneBreakdown.map((row) => [row.milestoneId, row.totalAmount])).toEqual([
      ['milestone-1', 300],
      ['milestone-2', 200],
      ['milestone-3', 0],
    ]);
    expect(statistic.milestoneBreakdown[2]).toMatchObject({
      milestoneId: 'milestone-3',
      expenseCount: 0,
      progress: 0,
    });
  });

  it('BALANCE-05: keeps sum(adjustedBalance) equal to the unallocated fund balance when income is left unallocated', () => {
    // Reproduces the reported bug: member-a pays for the group out of pocket,
    // members b/c/d each top up the shared fund via income (left unallocated)
    // instead of paying member-a back directly. Before the fix this made
    // memberBalances sum to the total top-up amount instead of zero/fund-balance.
    const members = [
      makeMember('member-a', 'A'),
      makeMember('member-b', 'B'),
      makeMember('member-c', 'C'),
      makeMember('member-d', 'D'),
    ];
    const expense = makeExpense({
      amount: 4000,
      paidByMemberId: 'member-a',
      participants: [
        { memberId: 'member-a', amount: 1000, percentage: null, shares: 1 },
        { memberId: 'member-b', amount: 1000, percentage: null, shares: 1 },
        { memberId: 'member-c', amount: 1000, percentage: null, shares: 1 },
        { memberId: 'member-d', amount: 1000, percentage: null, shares: 1 },
      ],
    });
    const incomes = [
      makeIncome({ id: 'income-b', contributedByMemberId: 'member-b', amount: 300 }),
      makeIncome({ id: 'income-c', contributedByMemberId: 'member-c', amount: 250 }),
      makeIncome({ id: 'income-d', contributedByMemberId: 'member-d', amount: 200 }),
    ];

    const statistic = service.calculate({
      members,
      expenses: [expense],
      incomes,
      milestones: [makeMilestone({ totalExpense: 4000 })],
      categories,
      settlements: [],
      ownerMemberId: OWNER,
    });

    expect(statistic.fund.unallocatedBalance).toBe(750);
    expect(statistic.invariant).toEqual({
      memberBalanceTotal: 750,
      unallocatedFundBalance: 750,
      difference: 0,
      valid: true,
    });
    expect(statistic.memberBalances.reduce((sum, row) => sum + row.adjustedBalance, 0)).toBe(
      statistic.fund.unallocatedBalance,
    );
  });

  it('BALANCE-01/02/03/04: fund-paid expenses decrease the fund and are excluded from any member paid total', () => {
    const members = [makeMember('member-a', 'A'), makeMember('member-b', 'B')];
    const fundExpense = makeExpense({
      id: 'expense-fund',
      amount: 400,
      paymentSourceType: 'fund',
      paidByMemberId: null,
      participants: [
        { memberId: 'member-a', amount: 200, percentage: null, shares: 1 },
        { memberId: 'member-b', amount: 200, percentage: null, shares: 1 },
      ],
    });
    const incomes = [makeIncome({ contributedByMemberId: 'member-a', amount: 1000 })];

    const statistic = service.calculate({
      members,
      expenses: [fundExpense],
      incomes,
      milestones: [makeMilestone({ totalExpense: 400 })],
      categories,
      settlements: [],
      ownerMemberId: OWNER,
    });

    expect(statistic.fund.unallocatedBalance).toBe(600);
    expect(statistic.memberBalances.find((row) => row.memberId === 'member-a')?.paid).toBe(0);
    expect(statistic.invariant.valid).toBe(true);
    expect(statistic.memberBalances.reduce((sum, row) => sum + row.adjustedBalance, 0)).toBe(
      statistic.fund.unallocatedBalance,
    );
  });

  it('ALLOC-04/05/06/09: reproduces the shared-fund-v2 regression case — income allocated to the fronting member zeroes the fund out', () => {
    const members = [
      makeMember('qp', 'QP'),
      makeMember('minh', 'Minh'),
      makeMember('huong', 'Hường'),
      makeMember('la', 'LA'),
    ];

    // Exact transportation-style split: each expense's participants sum to its
    // own amount, and the columns sum to the target owed amounts below.
    const expenses = [
      makeExpense({
        id: 'expense-qp',
        amount: 16409000,
        paidByMemberId: 'qp',
        participants: [
          { memberId: 'qp', amount: 9554500, percentage: null, shares: 1 },
          { memberId: 'minh', amount: 6854500, percentage: null, shares: 1 },
        ],
      }),
      makeExpense({
        id: 'expense-minh',
        amount: 14909000,
        paidByMemberId: 'minh',
        participants: [
          { memberId: 'minh', amount: 6700000, percentage: null, shares: 1 },
          { memberId: 'huong', amount: 8209000, percentage: null, shares: 1 },
        ],
      }),
      makeExpense({
        id: 'expense-huong',
        amount: 5500000,
        paidByMemberId: 'huong',
        participants: [
          { memberId: 'huong', amount: 1345500, percentage: null, shares: 1 },
          { memberId: 'la', amount: 4154500, percentage: null, shares: 1 },
        ],
      }),
      makeExpense({
        id: 'expense-la',
        amount: 9400000,
        paidByMemberId: 'la',
        participants: [{ memberId: 'la', amount: 9400000, percentage: null, shares: 1 }],
      }),
    ];

    const incomes = [
      makeIncome({
        id: 'income-minh',
        contributedByMemberId: 'minh',
        allocatedToMemberId: 'qp',
        amount: 2394250,
      }),
      makeIncome({
        id: 'income-huong',
        contributedByMemberId: 'huong',
        allocatedToMemberId: 'qp',
        amount: 2838250,
      }),
      makeIncome({
        id: 'income-la',
        contributedByMemberId: 'la',
        allocatedToMemberId: 'qp',
        amount: 2200000,
      }),
    ];

    const statistic = service.calculate({
      members,
      expenses,
      incomes,
      milestones: [makeMilestone({ totalExpense: 46218000 })],
      categories,
      settlements: [],
      ownerMemberId: OWNER,
    });

    expect(statistic.memberBalances).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ memberId: 'qp', owed: 9554500, incomeAllocatedToMember: 7432500, adjustedBalance: -578000 }),
        expect.objectContaining({ memberId: 'minh', owed: 13554500, incomeAllocatedToMember: 0, adjustedBalance: 3748750 }),
        expect.objectContaining({ memberId: 'huong', owed: 9554500, incomeAllocatedToMember: 0, adjustedBalance: -1216250 }),
        expect.objectContaining({ memberId: 'la', owed: 13554500, incomeAllocatedToMember: 0, adjustedBalance: -1954500 }),
      ]),
    );
    expect(statistic.fund.unallocatedBalance).toBe(0);
    expect(statistic.invariant).toEqual({
      memberBalanceTotal: 0,
      unallocatedFundBalance: 0,
      difference: 0,
      valid: true,
    });
  });
});
