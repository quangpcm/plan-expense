import type { Timestamp } from 'firebase/firestore';

import type { PlanMemberStatus, PlanRole } from '@/modules/member/types/member';

export type PlanStatus = 'active' | 'completed' | 'closed' | 'archived';

export type PlanType =
  | 'debt'
  | 'travel'
  | 'wedding'
  | 'saving'
  | 'birthday'
  | 'event'
  | 'shared_living'
  | 'project'
  | 'general';

export type CurrencyCode = 'VND';

export type DebtModel = 'finance_aggregate' | 'native_debt';

export type PlanDocument = {
  id: string;
  name: string;
  description: string | null;
  planType: PlanType;
  debtModel?: DebtModel | undefined;
  ownerUserId: string;
  ownerMemberId: string;
  currency: CurrencyCode;
  timezone: string;
  coverImageUrl: string | null;
  coverImageStoragePath: string | null;
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  budgetAmount: number | null;
  estimatedAmount: number | null;
  savingGoalAmount: number | null;
  savingTargetDate: Timestamp | null;
  status: PlanStatus;
  memberCount: number;
  milestoneCount: number;
  completedMilestoneCount: number;
  todoCount: number;
  completedTodoCount: number;
  expenseCount: number;
  incomeCount: number;
  settlementCount: number;
  totalExpense: number;
  totalIncome: number;
  debtReceivableOutstanding?: number | undefined;
  debtPayableOutstanding?: number | undefined;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  closedAt: Timestamp | null;
  archivedAt: Timestamp | null;
};

export type UserPlanDocument = {
  id: string;
  planId: string;
  userId: string;
  planName: string;
  planType: PlanType;
  debtModel?: DebtModel | undefined;
  role: PlanRole;
  memberId: string;
  memberStatus: PlanMemberStatus;
  planStatus: PlanStatus;
  archivedAt: Timestamp | null;
  coverImageUrl: string | null;
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  budgetAmount: number | null;
  estimatedAmount: number | null;
  savingGoalAmount: number | null;
  savingTargetDate: Timestamp | null;
  milestoneCount: number;
  completedMilestoneCount: number;
  todoCount: number;
  completedTodoCount: number;
  totalExpense: number;
  totalIncome: number;
  debtReceivableOutstanding?: number | undefined;
  debtPayableOutstanding?: number | undefined;
  isLocked: boolean;
  memberCount: number;
  joinedAt: Timestamp | null;
  lastActivityAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreatePlanInput = {
  name: string;
  description?: string | undefined;
  planType: PlanType;
  startDate?: string | undefined;
  endDate?: string | undefined;
  budgetAmount?: number | undefined;
  savingGoalAmount?: number | undefined;
  savingTargetDate?: string | undefined;
};

export type UpdatePlanInput = {
  name: string;
  description?: string | undefined;
  planType: PlanType;
  status: PlanStatus;
  startDate?: string | undefined;
  endDate?: string | undefined;
  budgetAmount?: number | undefined;
  savingGoalAmount?: number | undefined;
  savingTargetDate?: string | undefined;
};

export type PlanSummary = {
  id: string;
  planId: string;
  planName: string;
  planType: PlanType;
  debtModel?: DebtModel | undefined;
  role: PlanRole;
  memberId: string;
  memberStatus: PlanMemberStatus;
  planStatus: PlanStatus;
  archivedAt: Timestamp | null;
  coverImageUrl: string | null;
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  budgetAmount: number | null;
  estimatedAmount: number | null;
  savingGoalAmount: number | null;
  savingTargetDate: Timestamp | null;
  milestoneCount: number;
  completedMilestoneCount: number;
  todoCount: number;
  completedTodoCount: number;
  totalExpense: number;
  totalIncome: number;
  debtReceivableOutstanding?: number | undefined;
  debtPayableOutstanding?: number | undefined;
  isLocked: boolean;
  memberCount: number;
  joinedAt: Timestamp | null;
  lastActivityAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
