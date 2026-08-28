import type { TodoRepository } from '@/modules/todo/repositories/todo.repository';
import type { AddTodoVendorSchema } from '@/modules/todo/schemas/add-todo-vendor.schema';
import type { UpdateTodoVendorSchema } from '@/modules/todo/schemas/update-todo-vendor.schema';
import type {
  CreateTodoInput,
  MoveTodoToMilestoneInput,
  ReorderTodosWithinMilestoneInput,
  TodoDocument,
  UpdateTodoInput,
} from '@/modules/todo/types/todo';
import type { AuthUser } from '@/modules/auth/types/auth';
import { hasPlanCapability } from '@/modules/member/services/permission.service';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import { deleteAttachmentsInBackground } from '@/modules/storage/utils/delete-attachments';
import { resolveAttachmentDrafts } from '@/modules/storage/utils/resolve-attachments';
import { AppError } from '@/shared/errors/app-error';

export class TodoService {
  constructor(private readonly todoRepository: TodoRepository) {}

  private assertCreatePermission(currentMember: PlanMemberDocument | null) {
    if (!hasPlanCapability(currentMember, 'planning.createTodo')) {
      throw new AppError('You do not have permission to create todos.', 'TODO_PERMISSION_DENIED', 403);
    }
  }

  private assertCanEditTodo(currentMember: PlanMemberDocument | null, todo: TodoDocument, currentUser: AuthUser) {
    const canEditAll = hasPlanCapability(currentMember, 'planning.editAllTodo');
    const canEditOwn =
      hasPlanCapability(currentMember, 'planning.editOwnTodo') && todo.createdByUserId === currentUser.uid;

    if (!canEditAll && !canEditOwn) {
      throw new AppError('You do not have permission to edit this todo.', 'TODO_PERMISSION_DENIED', 403);
    }
  }

  private assertCanDeleteTodo(currentMember: PlanMemberDocument | null, todo: TodoDocument, currentUser: AuthUser) {
    const canDeleteAll = hasPlanCapability(currentMember, 'planning.deleteAllTodo');
    const canDeleteOwn =
      hasPlanCapability(currentMember, 'planning.deleteOwnTodo') && todo.createdByUserId === currentUser.uid;

    if (!canDeleteAll && !canDeleteOwn) {
      throw new AppError('You do not have permission to delete this todo.', 'TODO_PERMISSION_DENIED', 403);
    }
  }

  // Bulk operations across a whole milestone's todo list aren't scoped to a
  // single owned resource, so they require manage-all rather than per-todo
  // ownership checks.
  private assertCanManageAllTodos(currentMember: PlanMemberDocument | null) {
    if (!hasPlanCapability(currentMember, 'planning.editAllTodo')) {
      throw new AppError('You do not have permission to reorganize todos.', 'TODO_PERMISSION_DENIED', 403);
    }
  }

  private assertEditablePlan(plan: PlanDocument) {
    if (plan.status !== 'active') {
      throw new AppError('This plan has ended and cannot be edited.', 'PLAN_ENDED', 400);
    }
  }

  async createTodo(
    plan: PlanDocument,
    input: CreateTodoInput,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertCreatePermission(currentMember);

    const title = input.title.trim();

    if (!title) {
      throw new AppError('Todo title is required.', 'TODO_TITLE_REQUIRED', 400);
    }

    const todoId = this.todoRepository.generateTodoId(plan.id);
    const attachments = await resolveAttachmentDrafts(
      { mediaType: 'todo-attachment', planId: plan.id, todoId },
      input.attachments,
    );

    await this.todoRepository.createTodo({
      planId: plan.id,
      todoId,
      milestoneId: input.milestoneId,
      title,
      description: input.description?.trim() || null,
      assigneeMemberId: input.assigneeMemberId?.trim() || null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      priority: input.priority,
      budget: input.budget ?? null,
      createdByUserId: currentUser.uid,
      attachments,
    });
  }

  async updateTodo(
    plan: PlanDocument,
    todo: TodoDocument,
    input: UpdateTodoInput,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertCanEditTodo(currentMember, todo, currentUser);

    const title = input.title.trim();

    if (!title) {
      throw new AppError('Todo title is required.', 'TODO_TITLE_REQUIRED', 400);
    }

    const attachments =
      input.attachments !== undefined
        ? await resolveAttachmentDrafts(
            { mediaType: 'todo-attachment', planId: plan.id, todoId: input.todoId },
            input.attachments,
          )
        : undefined;

    const { orphanedAttachments } = await this.todoRepository.updateTodo(plan.id, {
      ...input,
      title,
      attachments,
    });
    deleteAttachmentsInBackground(plan.id, orphanedAttachments);
  }

  async addVendor(
    plan: PlanDocument,
    todo: TodoDocument,
    input: AddTodoVendorSchema,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertCanEditTodo(currentMember, todo, currentUser);

    const name = input.name.trim();

    if (!name) {
      throw new AppError('Vendor name is required.', 'TODO_VENDOR_NAME_REQUIRED', 400);
    }

    const vendorId = crypto.randomUUID();
    const attachments = await resolveAttachmentDrafts(
      { mediaType: 'todo-vendor-attachment', planId: plan.id, todoId: input.todoId, vendorId },
      input.attachments,
    );

    await this.todoRepository.addVendor(plan.id, input.todoId, {
      id: vendorId,
      name,
      description: input.description?.trim() || null,
      link: input.link?.trim() || null,
      phoneNumber: input.phoneNumber?.trim() || null,
      price: input.price,
      attachments,
    });
  }

  async updateVendor(
    plan: PlanDocument,
    todo: TodoDocument,
    input: UpdateTodoVendorSchema,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertCanEditTodo(currentMember, todo, currentUser);

    const name = input.name.trim();

    if (!name) {
      throw new AppError('Vendor name is required.', 'TODO_VENDOR_NAME_REQUIRED', 400);
    }

    if (!todo.vendors.some((vendor) => vendor.id === input.vendorId)) {
      throw new AppError('Vendor không tồn tại trong công việc này.', 'TODO_VENDOR_NOT_FOUND', 400);
    }

    const attachments = await resolveAttachmentDrafts(
      { mediaType: 'todo-vendor-attachment', planId: plan.id, todoId: todo.id, vendorId: input.vendorId },
      input.attachments,
    );

    const { orphanedAttachments } = await this.todoRepository.updateVendor(plan.id, todo.id, {
      vendorId: input.vendorId,
      name,
      description: input.description?.trim() || null,
      link: input.link?.trim() || null,
      phoneNumber: input.phoneNumber?.trim() || null,
      price: input.price,
      attachments,
    });
    deleteAttachmentsInBackground(plan.id, orphanedAttachments);
  }

  async deleteVendor(
    plan: PlanDocument,
    todo: TodoDocument,
    vendorId: string,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertCanEditTodo(currentMember, todo, currentUser);

    if (!todo.vendors.some((vendor) => vendor.id === vendorId)) {
      throw new AppError('Vendor không tồn tại trong công việc này.', 'TODO_VENDOR_NOT_FOUND', 400);
    }

    const { orphanedAttachments } = await this.todoRepository.deleteVendor(plan.id, todo.id, vendorId);
    deleteAttachmentsInBackground(plan.id, orphanedAttachments);
  }

  async reorderTodosWithinMilestone(
    plan: PlanDocument,
    input: ReorderTodosWithinMilestoneInput,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    void currentUser;
    this.assertEditablePlan(plan);
    this.assertCanManageAllTodos(currentMember);

    if (!input.milestoneId.trim() || input.orderedTodoIds.length === 0) {
      throw new AppError('Danh sách công việc để sắp xếp không hợp lệ.', 'TODO_REORDER_INVALID_INPUT', 400);
    }

    await this.todoRepository.reorderTodosWithinMilestone(plan.id, input);
  }

  async moveTodoToMilestone(
    plan: PlanDocument,
    input: MoveTodoToMilestoneInput,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    void currentUser;
    this.assertEditablePlan(plan);
    this.assertCanManageAllTodos(currentMember);

    if (!input.targetMilestoneId.trim()) {
      throw new AppError('Cần chọn milestone đích hợp lệ.', 'TODO_MOVE_TARGET_REQUIRED', 400);
    }

    await this.todoRepository.moveTodoToMilestone(plan.id, input);
  }

  async selectVendor(
    plan: PlanDocument,
    todo: TodoDocument,
    vendorId: string | null,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertCanEditTodo(currentMember, todo, currentUser);

    if (vendorId && !todo.vendors.some((vendor) => vendor.id === vendorId)) {
      throw new AppError('Vendor không tồn tại trong công việc này.', 'TODO_VENDOR_NOT_FOUND', 400);
    }

    await this.todoRepository.selectVendor(plan.id, todo.id, vendorId);
  }

  async deleteTodo(
    plan: PlanDocument,
    todo: TodoDocument,
    currentUser: AuthUser,
    currentMember: PlanMemberDocument | null,
  ) {
    this.assertEditablePlan(plan);
    this.assertCanDeleteTodo(currentMember, todo, currentUser);

    const { orphanedAttachments } = await this.todoRepository.deleteTodo(plan.id, todo.id);
    deleteAttachmentsInBackground(plan.id, orphanedAttachments);
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

  getOverdueActiveTodos(planId: string, params: Parameters<TodoRepository['getOverdueActiveTodos']>[1]) {
    return this.todoRepository.getOverdueActiveTodos(planId, params);
  }

  getActiveTodosDueBetween(planId: string, params: Parameters<TodoRepository['getActiveTodosDueBetween']>[1]) {
    return this.todoRepository.getActiveTodosDueBetween(planId, params);
  }

  getCompletedTodosDueBetween(planId: string, params: Parameters<TodoRepository['getCompletedTodosDueBetween']>[1]) {
    return this.todoRepository.getCompletedTodosDueBetween(planId, params);
  }
}
