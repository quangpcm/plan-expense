'use client';

import { useEffect, useRef, useState } from 'react';
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
import { AttachmentPicker, type AttachmentDraft } from '@/modules/storage';
import { AmountInput } from '@/shared/components/ui/amount-input';
import { Button } from '@/shared/components/ui/button';
import { DateField } from '@/shared/components/ui/date-field';
import { DropdownSelect } from '@/shared/components/ui/dropdown-select';
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
  onCancel?: () => void;
};

export function TodoForm({
  plan,
  milestone,
  members,
  currentMember,
  currentUser,
  todo,
  onSuccess,
  onCancel,
}: TodoFormProps) {
  const [title, setTitle] = useState(todo?.title ?? '');
  const [description, setDescription] = useState(todo?.description ?? '');
  const [assigneeMemberId, setAssigneeMemberId] = useState(todo?.assigneeMemberId ?? '');
  const [dueDate, setDueDate] = useState(todo?.dueDate ? new Date(todo.dueDate.toDate()).toISOString().slice(0, 10) : '');
  const [priority, setPriority] = useState<TodoDocument['priority']>(todo?.priority ?? 'medium');
  const [status, setStatus] = useState<TodoDocument['status']>(todo?.status ?? 'todo');
  const [budget, setBudget] = useState(todo?.budget ?? 0);
  const [attachmentDrafts, setAttachmentDrafts] = useState<AttachmentDraft[]>(
    (todo?.attachments ?? []).map((attachment) => ({ kind: 'existing', id: attachment.id, attachment })),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (errorMessage || successMessage) {
      messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [errorMessage, successMessage]);

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
          attachments: attachmentDrafts,
        });

        await todoService.updateTodo(plan, todo, parsed, currentUser, currentMember);
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
          attachments: attachmentDrafts,
        });

        await todoService.createTodo(plan, parsed, currentUser, currentMember);
        setSuccessMessage('Đã tạo công việc mới.');
        setTitle('');
        setDescription('');
        setAssigneeMemberId('');
        setDueDate('');
        setPriority('medium');
        setBudget(0);
        setAttachmentDrafts([]);
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
      {errorMessage || successMessage ? (
        <div ref={messageRef}>
          {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
          {successMessage ? <AuthFormMessage message={successMessage} type="success" /> : null}
        </div>
      ) : null}
      <div className="space-y-2 text-center">
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#727687]">Ngân sách dự tính</label>
        <AmountInput onChange={setBudget} value={budget} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Tên công việc</label>
        <Input onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Khảo sát 3 nhà hàng" value={title} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Mô tả</label>
        <Textarea onChange={(event) => setDescription(event.target.value)} placeholder="Ghi chú ngắn cho việc này" value={description} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Người phụ trách</label>
          <DropdownSelect
            onValueChange={setAssigneeMemberId}
            options={[
              { value: '', label: 'Chưa giao' },
              ...activeMembers.map((member) => ({ value: member.id, label: member.nickname })),
            ]}
            value={assigneeMemberId}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Hạn hoàn thành</label>
          <DateField onChange={(event) => setDueDate(event.target.value)} value={dueDate} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Ưu tiên</label>
          <DropdownSelect
            onValueChange={(value) => setPriority(value as TodoDocument['priority'])}
            options={[
              { value: 'low', label: 'Thấp' },
              { value: 'medium', label: 'Trung bình' },
              { value: 'high', label: 'Cao' },
            ]}
            value={priority}
          />
        </div>
        {todo ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Trạng thái</label>
            <DropdownSelect
              onValueChange={(value) => setStatus(value as TodoDocument['status'])}
              options={[
                { value: 'todo', label: 'Cần làm' },
                { value: 'in_progress', label: 'Đang làm' },
                { value: 'done', label: 'Hoàn thành' },
                { value: 'cancelled', label: 'Đã hủy' },
              ]}
              value={status}
            />
          </div>
        ) : null}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Hình ảnh</label>
        <AttachmentPicker maxCount={5} onChange={setAttachmentDrafts} value={attachmentDrafts} />
      </div>
      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button onClick={onCancel} type="button" variant="ghost">
            Đóng form
          </Button>
        ) : null}
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Đang lưu...' : todo ? 'Lưu công việc' : 'Tạo công việc'}
        </Button>
      </div>
    </form>
  );
}
