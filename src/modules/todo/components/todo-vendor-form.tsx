'use client';

import { useEffect, useRef, useState } from 'react';
import { ZodError } from 'zod';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { addTodoVendorSchema } from '@/modules/todo/schemas/add-todo-vendor.schema';
import { updateTodoVendorSchema } from '@/modules/todo/schemas/update-todo-vendor.schema';
import { todoService } from '@/modules/todo/services';
import type { TodoDocument, TodoVendor } from '@/modules/todo/types/todo';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import type { AuthUser } from '@/modules/auth/types/auth';
import { AttachmentPicker, type AttachmentDraft } from '@/modules/storage';
import { AmountInput } from '@/shared/components/ui/amount-input';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';

type TodoVendorFormProps = {
  plan: PlanDocument;
  todo: TodoDocument;
  vendor?: TodoVendor;
  currentMember: PlanMemberDocument | null;
  currentUser: AuthUser | null;
  onSuccess?: () => void;
  onClose?: () => void;
};

export function TodoVendorForm({
  plan,
  todo,
  vendor,
  currentMember,
  currentUser,
  onSuccess,
  onClose,
}: TodoVendorFormProps) {
  const [name, setName] = useState(vendor?.name ?? '');
  const [description, setDescription] = useState(vendor?.description ?? '');
  const [link, setLink] = useState(vendor?.link ?? '');
  const [phoneNumber, setPhoneNumber] = useState(vendor?.phoneNumber ?? '');
  const [price, setPrice] = useState(vendor?.price ?? 0);
  const [attachmentDrafts, setAttachmentDrafts] = useState<AttachmentDraft[]>(
    (vendor?.attachments ?? []).map((attachment) => ({ kind: 'existing', id: attachment.id, attachment })),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (errorMessage) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [errorMessage]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser) {
      setErrorMessage('Bạn cần đăng nhập để thao tác với công việc.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (vendor) {
        const parsed = updateTodoVendorSchema.parse({
          todoId: todo.id,
          vendorId: vendor.id,
          name,
          description,
          link,
          phoneNumber,
          price,
          attachments: attachmentDrafts,
        });

        await todoService.updateVendor(plan, todo, parsed, currentUser, currentMember);
      } else {
        const parsed = addTodoVendorSchema.parse({
          todoId: todo.id,
          name,
          description,
          link,
          phoneNumber,
          price,
          attachments: attachmentDrafts,
        });

        await todoService.addVendor(plan, todo, parsed, currentUser, currentMember);
        setName('');
        setDescription('');
        setLink('');
        setPhoneNumber('');
        setPrice(0);
        setAttachmentDrafts([]);
      }

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
      {errorMessage ? (
        <div ref={errorRef}>
          <AuthFormMessage message={errorMessage} type="error" />
        </div>
      ) : null}
      <div className="space-y-2 text-center">
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Giá tham khảo</label>
        <AmountInput onChange={setPrice} value={price} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Tên nhà cung cấp</label>
        <Input onChange={(event) => setName(event.target.value)} placeholder="Ví dụ: Studio Ali" value={name} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Số điện thoại</label>
        <Input
          onChange={(event) => setPhoneNumber(event.target.value)}
          placeholder="VD: 0905 123 456"
          type="tel"
          value={phoneNumber}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Link tham khảo</label>
        <Input onChange={(event) => setLink(event.target.value)} placeholder="Không bắt buộc" value={link} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Mô tả ngắn</label>
        <Textarea
          className="min-h-20"
          maxLength={280}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Không bắt buộc"
          value={description}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">Hình ảnh</label>
        <AttachmentPicker onChange={setAttachmentDrafts} value={attachmentDrafts} />
      </div>
      <div className="flex items-center justify-end gap-2">
        {onClose ? (
          <Button onClick={onClose} variant="ghost">
            Đóng form
          </Button>
        ) : null}
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Đang lưu...' : vendor ? 'Lưu thay đổi' : 'Thêm nhà cung cấp'}
        </Button>
      </div>
    </form>
  );
}
