import type { TodoDocument } from '@/modules/todo/types/todo';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import { Card } from '@/shared/components/ui/card';
import { cn } from '@/shared/utils/cn';

import { TodoCard } from './todo-card';

type TodoListProps = {
  todos: TodoDocument[];
  milestones?: MilestoneDocument[];
  preserveOrder?: boolean;
  members: PlanMemberDocument[];
  className?: string;
  onViewTodo: (todo: TodoDocument) => void;
  emptyMessage: string;
};

export function TodoList({
  todos,
  milestones = [],
  preserveOrder = false,
  members,
  className,
  onViewTodo,
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
    <div className={cn('grid grid-cols-1 gap-3', className)}>
      {sortedTodos.map((todo) => (
        <TodoCard
          assignee={members.find((member) => member.id === todo.assigneeMemberId) ?? null}
          key={todo.id}
          milestone={milestones.find((milestone) => milestone.id === todo.milestoneId) ?? null}
          onViewTodo={onViewTodo}
          todo={todo}
        />
      ))}
    </div>
  );
}
