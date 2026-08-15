import type {
  MoveTodoToMilestoneInput,
  ReorderTodosWithinMilestoneInput,
  TodoDocument,
  UpdateTodoInput,
} from '@/modules/todo/types/todo';

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
  price: number;
  attachments: TodoDocument['attachments'];
};

export type UpdateTodoVendorPersistenceInput = {
  vendorId: string;
  name: string;
  description: string | null;
  link: string | null;
  price: number;
  attachments?: TodoDocument['attachments'] | undefined;
};

export interface TodoRepository {
  generateTodoId(planId: string): string;
  createTodo(input: CreateTodoPersistenceInput): Promise<{ todoId: string }>;
  updateTodo(planId: string, input: UpdateTodoPersistenceInput): Promise<void>;
  reorderTodosWithinMilestone(planId: string, input: ReorderTodosWithinMilestoneInput): Promise<void>;
  moveTodoToMilestone(planId: string, input: MoveTodoToMilestoneInput): Promise<void>;
  addVendor(planId: string, todoId: string, vendor: AddTodoVendorPersistenceInput): Promise<void>;
  updateVendor(planId: string, todoId: string, input: UpdateTodoVendorPersistenceInput): Promise<void>;
  deleteVendor(planId: string, todoId: string, vendorId: string): Promise<void>;
  selectVendor(planId: string, todoId: string, vendorId: string | null): Promise<void>;
  deleteTodo(planId: string, todoId: string): Promise<void>;
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
}
