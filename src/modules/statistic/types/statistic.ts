import type { IncomeDocument } from '@/modules/income/types/income';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { ExpenseDocument } from '@/modules/expense/types/expense';
import type { Category } from '@/modules/category/types/category';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import type { SettlementDocument } from '@/modules/settlement/types/settlement';

export type MemberBalanceRow = {
  memberId: string;
  nickname: string;
  avatarUrl?: string | null;
  paid: number;
  owed: number;
  balance: number;
  totalIncome: number;
  settlementPaid: number;
  settlementReceived: number;
  adjustedBalance: number;
};

export type CategoryStatisticRow = {
  categoryId: string | null;
  categoryName: string;
  icon: string | null;
  iconColor: string;
  iconBgColor: string;
  totalAmount: number;
};

export type TimelineStatisticRow = {
  date: string;
  totalAmount: number;
};

export type MilestoneMemberStatisticRow = {
  memberId: string;
  nickname: string;
  totalAmount: number;
};

export type MilestoneStatisticRow = {
  milestoneId: string;
  milestoneTitle: string;
  status: MilestoneDocument['status'];
  totalAmount: number;
  budgetAmount: number | null;
  expenseCount: number;
  todoCount: number;
  completedTodoCount: number;
  progress: number;
  memberBreakdown: MilestoneMemberStatisticRow[];
};

export type StatisticSummary = {
  totalExpense: number;
  totalIncome: number;
  memberCount: number;
  expenseCount: number;
  averageExpense: number;
};

export type StatisticResult = {
  overview: StatisticSummary;
  memberBalances: MemberBalanceRow[];
  milestoneBreakdown: MilestoneStatisticRow[];
  categoryBreakdown: CategoryStatisticRow[];
  expenseTimeline: TimelineStatisticRow[];
};

export type StatisticInput = {
  members: PlanMemberDocument[];
  expenses: ExpenseDocument[];
  incomes: IncomeDocument[];
  milestones: MilestoneDocument[];
  categories: Category[];
  settlements: SettlementDocument[];
};
