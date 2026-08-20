'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ZodError } from 'zod';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { useAuthActions } from '@/modules/auth/hooks/use-auth-actions';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import {
  updateDisplayNameSchema,
  type UpdateDisplayNameSchema,
} from '@/modules/auth/schemas/update-display-name.schema';
import { memberService } from '@/modules/member/services';
import { BottomSheet } from '@/shared/components/ui/bottom-sheet';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

type DisplayNameSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function DisplayNameSheet({ open, onClose }: DisplayNameSheetProps) {
  const { user } = useAuthSession();
  const { updateDisplayName } = useAuthActions();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const form = useForm<UpdateDisplayNameSchema>({
    defaultValues: { displayName: user?.displayName || '' },
  });

  const handleSave = form.handleSubmit(async (values) => {
    if (!user) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const parsed = updateDisplayNameSchema.parse(values);
      await updateDisplayName(parsed.displayName);
      await memberService.cascadeNicknameUpdate(user.uid, parsed.displayName);
      onClose();
    } catch (error) {
      if (error instanceof ZodError) {
        setMessage({ type: 'error', text: error.issues[0]?.message || 'Vui lòng kiểm tra lại tên hiển thị.' });
      } else if (error instanceof Error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'error', text: 'Hiện chưa thể cập nhật tên hiển thị.' });
      }
    } finally {
      setIsSaving(false);
    }
  });

  return (
    <BottomSheet
      description="Tên này áp dụng cho mọi kế hoạch bạn tham gia, trừ những kế hoạch mà nickname của bạn đã được tùy chỉnh riêng."
      onClose={onClose}
      open={open}
      showCloseButton
      title="Tên hiển thị"
    >
      <form className="space-y-3" onSubmit={handleSave}>
        <Input autoFocus placeholder="Tên hiển thị" {...form.register('displayName')} />
        {message ? <AuthFormMessage message={message.text} type={message.type} /> : null}
        <Button className="w-full" disabled={isSaving} type="submit">
          {isSaving ? 'Đang lưu...' : 'Lưu tên hiển thị'}
        </Button>
      </form>
    </BottomSheet>
  );
}
