'use client';

import { useState } from 'react';
import { ZodError } from 'zod';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { createTodoSchema } from '@/modules/todo/schemas/create-todo.schema';
import { updateTodoSchema } from '@/modules/todo/schemas/update-todo.schema';
import { todoService } from '@/modules/todo/services';
import type { TodoDocument } from '@/modules/todo/types/todo';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import type { PlanDocument } from '@/modules/plan/types/plan';
import type { AuthUser } from '@/modules/auth/types/auth';
import { AmountInput } from '@/shared/components/ui/amount-input';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';

type TodoFormProps = {
  plan: PlanDocument;
  milestone: MilestoneDocument;
  members: PlanMemberDocument[];
  currentMember: PlanMemberDocument | null;
  currentUser: AuthUser | null;
  todo?: TodoDocument;
  onSuccess?: () => void;
};

export function TodoForm({
  plan,
  milestone,
  members,
  currentMember,
  currentUser,
  todo,
  onSuccess,
}: TodoFormProps) {
  const [title, setTitle] = useState(todo?.title ?? '');
  const [description, setDescription] = useState(todo?.description ?? '');
  const [assigneeMemberId, setAssigneeMemberId] = useState(todo?.assigneeMemberId ?? '');
  const [dueDate, setDueDate] = useState(todo?.dueDate ? new Date(todo.dueDate.toDate()).toISOString().slice(0, 10) : '');
  const [priority, setPriority] = useState<TodoDocument['priority']>(todo?.priority ?? 'medium');
  const [status, setStatus] = useState<TodoDocument['status']>(todo?.status ?? 'todo');
  const [budget, setBudget] = useState(todo?.budget ?? 0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeMembers = members.filter((member) => member.status === 'active');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser) {
      setErrorMessage('Bạn cần đăng nhập để thao tác với công việc.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (todo) {
        const parsed = updateTodoSchema.parse({
          todoId: todo.id,
          milestoneId: milestone.id,
          title,
          description,
          assigneeMemberId,
          dueDate,
          priority,
          status,
          budget: budget > 0 ? budget : undefined,
        });

        await todoService.updateTodo(plan, parsed, currentUser, currentMember);
        setSuccessMessage('Đã cập nhật công việc.');
      } else {
        const parsed = createTodoSchema.parse({
          milestoneId: milestone.id,
          title,
          description,
          assigneeMemberId,
          dueDate,
          priority,
          budget: budget > 0 ? budget : undefined,
        });

        await todoService.createTodo(plan, parsed, currentUser, currentMember);
        setSuccessMessage('Đã tạo công việc mới.');
        setTitle('');
        setDescription('');
        setAssigneeMemberId('');
        setDueDate('');
        setPriority('medium');
        setBudget(0);
      }

      onSuccess?.();
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues.map((issue) => issue.message).join(' | '));
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Hiện chưa thể lưu công việc này.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      {successMessage ? <AuthFormMessage message={successMessage} type="success" /> : null}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Tên công việc</label>
        <Input onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Khảo sát 3 nhà hàng" value={title} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Mô tả</label>
        <Textarea onChange={(event) => setDescription(event.target.value)} placeholder="Ghi chú ngắn cho việc này" value={description} />
      </div>
      <div className="space-y-2 text-center">
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#727687]">Ngân sách dự tính</label>
        <AmountInput onChange={setBudget} value={budget} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Người phụ trách</label>
          <select
            className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            onChange={(event) => setAssigneeMemberId(event.target.value)}
            value={assigneeMemberId}
          >
            <option value="">Chưa giao</option>
            {activeMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.nickname}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Hạn hoàn thành</label>
          <Input onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Ưu tiên</label>
          <select
            className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            onChange={(event) => setPriority(event.target.value as TodoDocument['priority'])}
            value={priority}
          >
            <option value="low">Thấp</option>
            <option value="medium">Trung bình</option>
            <option value="high">Cao</option>
          </select>
        </div>
      </div>
      {todo ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Trạng thái</label>
          <select
            className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            onChange={(event) => setStatus(event.target.value as TodoDocument['status'])}
            value={status}
          >
            <option value="todo">Cần làm</option>
            <option value="in_progress">Đang làm</option>
            <option value="done">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      ) : null}
      <div className="flex justify-end">
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Đang lưu...' : todo ? 'Lưu công việc' : 'Tạo công việc'}
        </Button>
      </div>
    </form>
  );
}
