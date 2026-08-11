import type { TodoDocument, UpdateTodoInput } from '@/modules/todo/types/todo';

export type CreateTodoPersistenceInput = {
  planId: string;
  milestoneId: string;
  title: string;
  description: string | null;
  assigneeMemberId: string | null;
  dueDate: Date | null;
  priority: TodoDocument['priority'];
  budget: number | null;
  createdByUserId: string;
};

export type AddTodoVendorPersistenceInput = {
  name: string;
  link: string | null;
  price: number;
};

export interface TodoRepository {
  createTodo(input: CreateTodoPersistenceInput): Promise<{ todoId: string }>;
  updateTodo(planId: string, input: UpdateTodoInput): Promise<void>;
  addVendor(planId: string, todoId: string, vendor: AddTodoVendorPersistenceInput): Promise<void>;
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
