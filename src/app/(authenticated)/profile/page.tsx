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
import { Avatar } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { SectionHeading } from '@/shared/components/ui/section-heading';

export default function ProfilePage() {
  const { user } = useAuthSession();
  const { logout, updateDisplayName } = useAuthActions();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const form = useForm<UpdateDisplayNameSchema>({
    defaultValues: { displayName: user?.displayName || '' },
  });

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  }

  const handleSaveName = form.handleSubmit(async (values) => {
    if (!user) {
      return;
    }

    setIsSavingName(true);
    setNameMessage(null);

    try {
      const parsed = updateDisplayNameSchema.parse(values);
      await updateDisplayName(parsed.displayName);
      await memberService.cascadeNicknameUpdate(user.uid, parsed.displayName);
      setNameMessage({ type: 'success', text: 'Đã cập nhật tên hiển thị.' });
    } catch (error) {
      if (error instanceof ZodError) {
        setNameMessage({ type: 'error', text: error.issues[0]?.message || 'Vui lòng kiểm tra lại tên hiển thị.' });
      } else if (error instanceof Error) {
        setNameMessage({ type: 'error', text: error.message });
      } else {
        setNameMessage({ type: 'error', text: 'Hiện chưa thể cập nhật tên hiển thị.' });
      }
    } finally {
      setIsSavingName(false);
    }
  });

  return (
    <main className="flex flex-col gap-5">
      <Card>
        <div className="flex items-center gap-4">
          <Avatar className="size-14 text-base" initials={(user?.displayName || 'PE').slice(0, 2).toUpperCase()} />
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-950">{user?.displayName || 'User'}</h1>
            <p className="text-sm text-slate-600">{user?.email || 'No email found'}</p>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeading
          eyebrow="Tên hiển thị"
          title="Đổi tên hiển thị của bạn"
          description="Tên này áp dụng cho mọi kế hoạch bạn tham gia, trừ những kế hoạch mà nickname của bạn đã được tùy chỉnh riêng."
        />
        <form className="space-y-3" onSubmit={handleSaveName}>
          <Input placeholder="Tên hiển thị" {...form.register('displayName')} />
          {nameMessage ? <AuthFormMessage message={nameMessage.text} type={nameMessage.type} /> : null}
          <Button className="w-full sm:w-auto" disabled={isSavingName} type="submit">
            {isSavingName ? 'Đang lưu...' : 'Lưu tên hiển thị'}
          </Button>
        </form>
      </Card>

      <Card>
        <SectionHeading
          eyebrow="Profile"
          title="Account basics are connected."
          description="This page confirms the authenticated shell and user sync are working end to end."
        />
        <Button className="w-full sm:w-auto" disabled={isLoggingOut} onClick={handleLogout}>
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </Button>
      </Card>
    </main>
  );
}

