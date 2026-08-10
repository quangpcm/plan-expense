import type { Timestamp } from 'firebase/firestore';

export type TodoPriority = 'low' | 'medium' | 'high';
export type TodoStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';

export type TodoDocument = {
  id: string;
  planId: string;
  milestoneId: string;
  title: string;
  description: string | null;
  assigneeMemberId: string | null;
  dueDate: Timestamp | null;
  priority: TodoPriority;
  status: TodoStatus;
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
};
