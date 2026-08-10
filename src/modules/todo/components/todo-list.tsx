import { CheckCircle2, Circle, Clock3, PencilLine, XCircle } from 'lucide-react';

import type { TodoDocument } from '@/modules/todo/types/todo';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type TodoListProps = {
  todos: TodoDocument[];
  members: PlanMemberDocument[];
  canManagePlan: boolean;
  isSubmitting: boolean;
  onEdit: (todo: TodoDocument) => void;
  onChangeStatus: (todo: TodoDocument, status: TodoDocument['status']) => void;
  emptyMessage: string;
};

const priorityLabel: Record<TodoDocument['priority'], string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
};

const statusLabel: Record<TodoDocument['status'], string> = {
  todo: 'Cần làm',
  in_progress: 'Đang làm',
  done: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export function TodoList({
  todos,
  members,
  canManagePlan,
  isSubmitting,
  onEdit,
  onChangeStatus,
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
      {todos.map((todo) => {
        const assignee = members.find((member) => member.id === todo.assigneeMemberId);
        const dueDate = timestampToDate(todo.dueDate);

        return (
          <Card className="gap-4 border-slate-200 bg-white shadow-none" key={todo.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h4 className="text-base font-semibold text-slate-950">{todo.title}</h4>
                <p className="text-sm leading-6 text-slate-600">{todo.description || 'Chưa có mô tả.'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={todo.status === 'done' ? 'success' : todo.status === 'cancelled' ? 'neutral' : 'info'}>
                  {statusLabel[todo.status]}
                </Badge>
                <Badge variant="neutral">{priorityLabel[todo.priority]}</Badge>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Người phụ trách</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{assignee?.nickname || 'Chưa giao'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Hạn hoàn thành</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{dueDate ? formatDate(dueDate) : 'Chưa đặt'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Tiến độ</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{statusLabel[todo.status]}</p>
              </div>
            </div>
            {canManagePlan ? (
              <div className="flex flex-wrap justify-end gap-2">
                {todo.status !== 'done' ? (
                  <Button disabled={isSubmitting} onClick={() => onChangeStatus(todo, 'done')} variant="secondary">
                    <CheckCircle2 className="size-4" />
                    Hoàn thành
                  </Button>
                ) : (
                  <Button disabled={isSubmitting} onClick={() => onChangeStatus(todo, 'in_progress')} variant="secondary">
                    <Clock3 className="size-4" />
                    Đang làm lại
                  </Button>
                )}
                {todo.status !== 'cancelled' ? (
                  <Button disabled={isSubmitting} onClick={() => onChangeStatus(todo, 'cancelled')} variant="secondary">
                    <XCircle className="size-4" />
                    Hủy
                  </Button>
                ) : (
                  <Button disabled={isSubmitting} onClick={() => onChangeStatus(todo, 'todo')} variant="secondary">
                    <Circle className="size-4" />
                    Khôi phục
                  </Button>
                )}
                <Button disabled={isSubmitting} onClick={() => onEdit(todo)} variant="secondary">
                  <PencilLine className="size-4" />
                  Sửa
                </Button>
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
