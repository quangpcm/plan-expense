import type { TodoDocument } from '@/modules/todo/types/todo';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import { Card } from '@/shared/components/ui/card';

import { TodoCard } from './todo-card';

type TodoListProps = {
  todos: TodoDocument[];
  milestones?: MilestoneDocument[];
  preserveOrder?: boolean;
  members: PlanMemberDocument[];
  canManagePlan: boolean;
  isSubmitting: boolean;
  onEdit: (todo: TodoDocument) => void;
  onChangeStatus: (todo: TodoDocument, status: TodoDocument['status']) => void;
  onAddVendor: (todo: TodoDocument) => void;
  onDeleteTodo: (todo: TodoDocument) => void;
  emptyMessage: string;
};

export function TodoList({
  todos,
  milestones = [],
  preserveOrder = false,
  members,
  canManagePlan,
  isSubmitting,
  onEdit,
  onChangeStatus,
  onAddVendor,
  onDeleteTodo,
  emptyMessage,
}: TodoListProps) {
  if (todos.length === 0) {
    return (
      <Card className="border-slate-200 bg-slate-50 shadow-none">
        <p className="text-sm leading-6 text-slate-600">{emptyMessage}</p>
      </Card>
    );
  }

  const sortedTodos = preserveOrder ? todos : [...todos].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

  return (
    <div className="grid gap-3">
      {sortedTodos.map((todo) => (
        <TodoCard
          assignee={members.find((member) => member.id === todo.assigneeMemberId) ?? null}
          canManagePlan={canManagePlan}
          isSubmitting={isSubmitting}
          key={todo.id}
          milestone={milestones.find((milestone) => milestone.id === todo.milestoneId) ?? null}
          onAddVendor={onAddVendor}
          onChangeStatus={onChangeStatus}
          onDeleteTodo={onDeleteTodo}
          onEdit={onEdit}
          todo={todo}
        />
      ))}
    </div>
  );
}
