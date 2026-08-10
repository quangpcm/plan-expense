import type { TodoRepository } from '@/modules/todo/repositories/todo.repository';
import type { CreateTodoInput, UpdateTodoInput } from '@/modules/todo/types/todo';
import type { AuthUser } from '@/modules/auth/types/auth';
import { resolvePlanPermissions } from '@/modules/member/services/permission.service';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import { AppError } from '@/shared/errors/app-error';

export class TodoService {
  constructor(private readonly todoRepository: TodoRepository) {}

  private assertManagePlanPermission(currentMember: PlanMemberDocument | null) {
    if (!resolvePlanPermissions(currentMember).canManagePlan) {
      throw new AppError('Only the owner can manage todos.', 'TODO_PERMISSION_DENIED', 403);
    }
  }

  private assertEditablePlan(plan: PlanDocument) {
    if (plan.status === 'closed') {
      throw new AppError('This plan is closed and cannot be edited.', 'PLAN_CLOSED', 400);
    }
  }

  async createTodo(
    plan: PlanDocument,
    input: CreateTodoInput,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertManagePlanPermission(currentMember);

    const title = input.title.trim();

    if (!title) {
      throw new AppError('Todo title is required.', 'TODO_TITLE_REQUIRED', 400);
    }

    await this.todoRepository.createTodo({
      planId: plan.id,
      milestoneId: input.milestoneId,
      title,
      description: input.description?.trim() || null,
      assigneeMemberId: input.assigneeMemberId?.trim() || null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      priority: input.priority,
      createdByUserId: currentUser.uid,
    });
  }

  async updateTodo(
    plan: PlanDocument,
    input: UpdateTodoInput,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    void currentUser;
    this.assertEditablePlan(plan);
    this.assertManagePlanPermission(currentMember);

    const title = input.title.trim();

    if (!title) {
      throw new AppError('Todo title is required.', 'TODO_TITLE_REQUIRED', 400);
    }

    await this.todoRepository.updateTodo(plan.id, {
      ...input,
      title,
    });
  }

  async completeTodo(
    plan: PlanDocument,
    todoId: string,
    milestoneId: string,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    await this.updateTodo(
      plan,
      {
        todoId,
        milestoneId,
        title: '',
        priority: 'medium',
        status: 'done',
      },
      currentUser,
      currentMember,
    );
  }

  watchTodos(
    planId: string,
    callback: Parameters<TodoRepository['watchTodos']>[1],
    onError?: (error: Error) => void,
  ) {
    return this.todoRepository.watchTodos(planId, callback, onError);
  }

  watchTodosByMilestone(
    planId: string,
    milestoneId: string,
    callback: Parameters<TodoRepository['watchTodosByMilestone']>[2],
    onError?: (error: Error) => void,
  ) {
    return this.todoRepository.watchTodosByMilestone(planId, milestoneId, callback, onError);
  }
}
