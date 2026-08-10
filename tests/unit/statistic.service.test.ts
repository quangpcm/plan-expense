import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import { StatisticService } from '@/modules/statistic/services/statistic.service';
import type { CategoryDocument } from '@/modules/category/types/category';
import type { ExpenseDocument } from '@/modules/expense/types/expense';
import type { IncomeDocument } from '@/modules/income/types/income';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import type { SettlementDocument } from '@/modules/settlement/types/settlement';

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
      canEditAllExpenses: false,
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
    startDate: null,
    endDate: null,
    status: 'in_progress',
    orderIndex: 0,
    budgetAmount: 1000,
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
    title: 'Top up',
    categoryId: null,
    amount: 500,
    currency: 'VND',
    contributedByMemberId: 'member-a',
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
  const categories: CategoryDocument[] = [
    {
      id: 'cat-food',
      planId: 'plan-1',
      name: 'Food',
      icon: 'utensils',
      categoryType: 'expense',
      isDefault: true,
      isActive: true,
      sortOrder: 0,
      createdByUserId: 'user-a',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
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
    });

    expect(statistic.overview).toMatchObject({
      totalExpense: 300,
      memberCount: 2,
      expenseCount: 1,
      averageExpense: 300,
    });
    expect(statistic.memberBalances).toEqual([
      expect.objectContaining({
        memberId: 'member-a',
        paid: 300,
        owed: 150,
        balance: 650,
        totalIncome: 500,
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
        settlementPaid: 50,
        settlementReceived: 0,
        adjustedBalance: -100,
      }),
    ]);
    expect(statistic.categoryBreakdown).toEqual([
      {
        categoryId: 'cat-food',
        categoryName: 'Food',
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
});
