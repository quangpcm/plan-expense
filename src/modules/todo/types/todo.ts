import type { Timestamp } from 'firebase/firestore';

export type TodoPriority = 'low' | 'medium' | 'high';
export type TodoStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';

export type TodoVendor = {
  id: string;
  name: string;
  link: string | null;
  price: number;
};

export type TodoDocument = {
  id: string;
  planId: string;
  milestoneId: string;
  orderIndex: number;
  title: string;
  description: string | null;
  assigneeMemberId: string | null;
  dueDate: Timestamp | null;
  priority: TodoPriority;
  status: TodoStatus;
  budget: number | null;
  vendors: TodoVendor[];
  selectedTodoVendorId: string | null;
  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
  cancelledAt: Timestamp | null;
};

export type CreateTodoInput = {
  milestoneId: string;
  title: string;
  description?: string | undefined;
  assigneeMemberId?: string | undefined;
  dueDate?: string | undefined;
  priority: TodoPriority;
  budget?: number | undefined;
};

export type UpdateTodoInput = {
  todoId: string;
  milestoneId: string;
  title: string;
  description?: string | undefined;
  assigneeMemberId?: string | undefined;
  dueDate?: string | undefined;
  priority: TodoPriority;
  status: TodoStatus;
  budget?: number | undefined;
  selectedTodoVendorId?: string | undefined;
};

export type ReorderTodosWithinMilestoneInput = {
  milestoneId: string;
  orderedTodoIds: string[];
};

export type MoveTodoToMilestoneInput = {
  todoId: string;
  targetMilestoneId: string;
};
