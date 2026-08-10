import type { TodoDocument, UpdateTodoInput } from '@/modules/todo/types/todo';

export type CreateTodoPersistenceInput = {
  planId: string;
  milestoneId: string;
  title: string;
  description: string | null;
  assigneeMemberId: string | null;
  dueDate: Date | null;
  priority: TodoDocument['priority'];
  createdByUserId: string;
};

export interface TodoRepository {
  createTodo(input: CreateTodoPersistenceInput): Promise<{ todoId: string }>;
  updateTodo(planId: string, input: UpdateTodoInput): Promise<void>;
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
