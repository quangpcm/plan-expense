import type { IncomeDocument } from '@/modules/income/types/income';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { ExpenseDocument } from '@/modules/expense/types/expense';
import type { CategoryDocument } from '@/modules/category/types/category';

export type MemberBalanceRow = {
  memberId: string;
  nickname: string;
  paid: number;
  owed: number;
  balance: number;
  totalIncome: number;
};

export type CategoryStatisticRow = {
  categoryId: string | null;
  categoryName: string;
  totalAmount: number;
};

export type TimelineStatisticRow = {
  date: string;
  totalAmount: number;
};

export type StatisticSummary = {
  totalExpense: number;
  memberCount: number;
  expenseCount: number;
  averageExpense: number;
};

export type StatisticResult = {
  overview: StatisticSummary;
  memberBalances: MemberBalanceRow[];
  categoryBreakdown: CategoryStatisticRow[];
  expenseTimeline: TimelineStatisticRow[];
};

export type StatisticInput = {
  members: PlanMemberDocument[];
  expenses: ExpenseDocument[];
  incomes: IncomeDocument[];
  categories: CategoryDocument[];
};

