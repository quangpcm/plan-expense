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
import { planService } from '@/modules/plan/services';
import { useUserPlans } from '@/modules/plan/hooks/use-user-plans';
import { PasscodeForm } from '@/modules/user/components/passcode-form';
import { useCurrentUserProfile } from '@/modules/user/hooks/use-current-user-profile';
import { userService } from '@/modules/user/services';
import { Avatar } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { SectionHeading } from '@/shared/components/ui/section-heading';

export default function ProfilePage() {
  const { user } = useAuthSession();
  const { logout, updateDisplayName } = useAuthActions();
  const { userProfile } = useCurrentUserProfile();
  const { plans } = useUserPlans();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditingPasscode, setIsEditingPasscode] = useState(false);
  const [showClearPasscodeConfirm, setShowClearPasscodeConfirm] = useState(false);
  const [isClearingPasscode, setIsClearingPasscode] = useState(false);
  const [passcodeMessage, setPasscodeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const lockedPlanCount = plans.filter((plan) => plan.isLocked).length;
  const form = useForm<UpdateDisplayNameSchema>({
    defaultValues: { displayName: user?.displayName || '' },
  });

  async function handleClearPasscode() {
    if (!user) {
      return;
    }

    setIsClearingPasscode(true);
    setPasscodeMessage(null);

    try {
      await Promise.all([userService.clearPasscode(user.uid), planService.clearAllPlanSecurity(user.uid)]);
      setShowClearPasscodeConfirm(false);
      setPasscodeMessage({ type: 'success', text: 'Đã xóa mã bảo mật cá nhân.' });
    } catch (error) {
      setPasscodeMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Hiện chưa thể xóa mã bảo mật cá nhân.',
      });
    } finally {
      setIsClearingPasscode(false);
    }
  }

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
          eyebrow="Bảo mật"
          title="Mã bảo mật cá nhân"
          description="Mã 4 số này thuộc về tài khoản của bạn. Dùng để khóa riêng các kế hoạch bạn tự bật, không ảnh hưởng tới thành viên khác."
        />

        {passcodeMessage ? <AuthFormMessage message={passcodeMessage.text} type={passcodeMessage.type} /> : null}

        {isEditingPasscode && user ? (
          <PasscodeForm
            onClose={() => setIsEditingPasscode(false)}
            onSuccess={() => {
              setIsEditingPasscode(false);
              setPasscodeMessage({ type: 'success', text: 'Đã lưu mã bảo mật cá nhân.' });
            }}
            userId={user.uid}
          />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              {userProfile?.secretNumberHash ? 'Đã đặt mã bảo mật cá nhân.' : 'Chưa đặt mã bảo mật cá nhân.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setIsEditingPasscode(true)} variant="secondary">
                {userProfile?.secretNumberHash ? 'Đổi mã bảo mật cá nhân' : 'Đặt mã bảo mật cá nhân'}
              </Button>
              {userProfile?.secretNumberHash ? (
                <Button
                  className="border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                  onClick={() => setShowClearPasscodeConfirm(true)}
                  variant="secondary"
                >
                  Xóa mã bảo mật cá nhân
                </Button>
              ) : null}
            </div>
          </div>
        )}

        {showClearPasscodeConfirm ? (
          <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>
              {lockedPlanCount > 0
                ? `Bạn đang khóa ${lockedPlanCount} kế hoạch cho riêng mình bằng mã này. Xóa mã sẽ tắt khóa ở tất cả các kế hoạch đó.`
                : 'Bạn có chắc muốn xóa mã bảo mật cá nhân này?'}
            </p>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowClearPasscodeConfirm(false)} variant="ghost">
                Hủy
              </Button>
              <Button
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={isClearingPasscode}
                onClick={handleClearPasscode}
              >
                {isClearingPasscode ? 'Đang xóa...' : 'Xóa mã bảo mật cá nhân'}
              </Button>
            </div>
          </div>
        ) : null}
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
