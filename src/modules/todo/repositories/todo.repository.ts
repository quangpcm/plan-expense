import type { MediaAttachment } from '@/modules/storage/types/attachment';
import type {
  MoveTodoToMilestoneInput,
  ReorderTodosWithinMilestoneInput,
  TodoDocument,
  UpdateTodoInput,
} from '@/modules/todo/types/todo';

export type OrphanedAttachmentsResult = { orphanedAttachments: MediaAttachment[] };

export type CreateTodoPersistenceInput = {
  planId: string;
  todoId: string;
  milestoneId: string;
  title: string;
  description: string | null;
  assigneeMemberId: string | null;
  dueDate: Date | null;
  priority: TodoDocument['priority'];
  budget: number | null;
  createdByUserId: string;
  attachments: TodoDocument['attachments'];
};

export type UpdateTodoPersistenceInput = Omit<UpdateTodoInput, 'attachments'> & {
  attachments?: TodoDocument['attachments'] | undefined;
};

export type AddTodoVendorPersistenceInput = {
  id: string;
  name: string;
  description: string | null;
  link: string | null;
  phoneNumber: string | null;
  price: number;
  attachments: TodoDocument['attachments'];
};

export type UpdateTodoVendorPersistenceInput = {
  vendorId: string;
  name: string;
  description: string | null;
  link: string | null;
  phoneNumber: string | null;
  price: number;
  attachments?: TodoDocument['attachments'] | undefined;
};

export type TodoOverdueQuery = {
  beforeAt: Date;
  limitCount: number;
};

export type TodoDueWindowQuery = {
  startAt: Date;
  endAt: Date;
  limitCount: number;
};

export interface TodoRepository {
  generateTodoId(planId: string): string;
  createTodo(input: CreateTodoPersistenceInput): Promise<{ todoId: string }>;
  updateTodo(planId: string, input: UpdateTodoPersistenceInput): Promise<OrphanedAttachmentsResult>;
  reorderTodosWithinMilestone(planId: string, input: ReorderTodosWithinMilestoneInput): Promise<void>;
  moveTodoToMilestone(planId: string, input: MoveTodoToMilestoneInput): Promise<void>;
  addVendor(planId: string, todoId: string, vendor: AddTodoVendorPersistenceInput): Promise<void>;
  updateVendor(planId: string, todoId: string, input: UpdateTodoVendorPersistenceInput): Promise<OrphanedAttachmentsResult>;
  deleteVendor(planId: string, todoId: string, vendorId: string): Promise<OrphanedAttachmentsResult>;
  selectVendor(planId: string, todoId: string, vendorId: string | null): Promise<void>;
  deleteTodo(planId: string, todoId: string): Promise<OrphanedAttachmentsResult>;
  watchTodos(
    planId: string,
    callback: (todos: TodoDocument[]) => void,
    onError?: (error: Error) => void,
  ): () => void;
  watchTodosByMilestone(
    planId: string,
    milestoneId: string,
    callback: (todos: TodoDocument[]) => void,
    onError?: (error: Error) => void,
  ): () => void;
  // One-shot (getDocs) bounded queries for the Today dashboard read-model —
  // never use onSnapshot/full-collection reads for this (docs/today-dashboard-specs.md).
  getOverdueActiveTodos(planId: string, params: TodoOverdueQuery): Promise<TodoDocument[]>;
  getActiveTodosDueBetween(planId: string, params: TodoDueWindowQuery): Promise<TodoDocument[]>;
  getCompletedTodosDueBetween(planId: string, params: TodoDueWindowQuery): Promise<TodoDocument[]>;
}
