import type { TodoDocument } from '@/modules/todo/types/todo';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { Card } from '@/shared/components/ui/card';

import { TodoCard } from './todo-card';

type TodoListProps = {
  todos: TodoDocument[];
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

  return (
    <div className="grid gap-3">
      {todos.map((todo) => (
        <TodoCard
          assignee={members.find((member) => member.id === todo.assigneeMemberId) ?? null}
          canManagePlan={canManagePlan}
          isSubmitting={isSubmitting}
          key={todo.id}
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
