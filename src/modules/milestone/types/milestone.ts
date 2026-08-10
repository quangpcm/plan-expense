import type { Timestamp } from 'firebase/firestore';

export type MilestoneStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';

export type MilestoneDocument = {
  id: string;
  planId: string;
  title: string;
  description: string | null;
  iconId: string | null;
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  status: MilestoneStatus;
  orderIndex: number;
  budgetAmount: number | null;
  totalExpense: number;
  todoCount: number;
  completedTodoCount: number;
  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
  cancelledAt: Timestamp | null;
};

export type CreateMilestoneInput = {
  title: string;
  description?: string | undefined;
  iconId?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  budgetAmount?: number | undefined;
};

export type UpdateMilestoneInput = {
  milestoneId: string;
  title: string;
  description?: string | undefined;
  iconId?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  status: MilestoneStatus;
  budgetAmount?: number | undefined;
};

export type ReorderMilestoneInput = {
  milestoneId: string;
  orderIndex: number;
};
