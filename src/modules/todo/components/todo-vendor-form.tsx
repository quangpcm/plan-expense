'use client';

import { useState } from 'react';
import { ZodError } from 'zod';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { addTodoVendorSchema } from '@/modules/todo/schemas/add-todo-vendor.schema';
import { todoService } from '@/modules/todo/services';
import type { TodoDocument } from '@/modules/todo/types/todo';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import type { AuthUser } from '@/modules/auth/types/auth';
import { AmountInput } from '@/shared/components/ui/amount-input';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

type TodoVendorFormProps = {
  plan: PlanDocument;
  todo: TodoDocument;
  currentMember: PlanMemberDocument | null;
  currentUser: AuthUser | null;
  onSuccess?: () => void;
};

export function TodoVendorForm({ plan, todo, currentMember, currentUser, onSuccess }: TodoVendorFormProps) {
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [price, setPrice] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser) {
      setErrorMessage('Bạn cần đăng nhập để thao tác với công việc.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const parsed = addTodoVendorSchema.parse({
        todoId: todo.id,
        name,
        link,
        price,
      });

      await todoService.addVendor(plan, parsed, currentUser, currentMember);
      setName('');
      setLink('');
      setPrice(0);
      onSuccess?.();
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues.map((issue) => issue.message).join(' | '));
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Hiện chưa thể lưu nhà cung cấp này.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      <div className="space-y-2 text-center">
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#727687]">Giá tham khảo</label>
        <AmountInput onChange={setPrice} value={price} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Tên nhà cung cấp</label>
        <Input onChange={(event) => setName(event.target.value)} placeholder="Ví dụ: Studio Ali" value={name} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Link tham khảo</label>
        <Input onChange={(event) => setLink(event.target.value)} placeholder="Không bắt buộc" value={link} />
      </div>
      <div className="flex justify-end">
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Đang lưu...' : 'Thêm nhà cung cấp'}
        </Button>
      </div>
    </form>
  );
}
