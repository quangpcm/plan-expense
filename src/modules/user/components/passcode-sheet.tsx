'use client';

import { useState } from 'react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { planService } from '@/modules/plan/services';
import { PasscodeForm } from '@/modules/user/components/passcode-form';
import { userService } from '@/modules/user/services';
import { BottomSheet } from '@/shared/components/ui/bottom-sheet';
import { Button } from '@/shared/components/ui/button';

type PasscodeSheetProps = {
  open: boolean;
  onClose: () => void;
  userId: string;
  hasPasscode: boolean;
  lockedPlanCount: number;
};

type View = 'status' | 'edit' | 'confirm-clear';

export function PasscodeSheet({ open, onClose, userId, hasPasscode, lockedPlanCount }: PasscodeSheetProps) {
  const [view, setView] = useState<View>('status');
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function handleClose() {
    setView('status');
    setMessage(null);
    onClose();
  }

  async function handleClearPasscode() {
    setIsClearing(true);
    setMessage(null);

    try {
      await Promise.all([userService.clearPasscode(userId), planService.clearAllPlanSecurity(userId)]);
      handleClose();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Hiện chưa thể xóa mã bảo mật cá nhân.',
      });
    } finally {
      setIsClearing(false);
    }
  }

  return (
    <BottomSheet
      description="Mã 4 số này thuộc về tài khoản của bạn. Dùng để khóa riêng các kế hoạch bạn tự bật, không ảnh hưởng tới thành viên khác."
      onClose={handleClose}
      open={open}
      showCloseButton
      title="Mã bảo mật cá nhân"
    >
      <div className="space-y-4">
        {message ? <AuthFormMessage message={message.text} type={message.type} /> : null}

        {view === 'edit' ? (
          <PasscodeForm
            onClose={() => setView('status')}
            onSuccess={() => {
              setMessage({ type: 'success', text: 'Đã lưu mã bảo mật cá nhân.' });
              setView('status');
            }}
            userId={userId}
          />
        ) : null}

        {view === 'status' ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              {hasPasscode ? 'Đã đặt mã bảo mật cá nhân.' : 'Chưa đặt mã bảo mật cá nhân.'}
            </p>
            <Button className="w-full" onClick={() => setView('edit')} variant="secondary">
              {hasPasscode ? 'Đổi mã bảo mật cá nhân' : 'Đặt mã bảo mật cá nhân'}
            </Button>
            {hasPasscode ? (
              <button
                className="w-full text-center text-sm font-medium text-red-600 hover:text-red-700"
                onClick={() => setView('confirm-clear')}
                type="button"
              >
                Xóa mã bảo mật cá nhân
              </button>
            ) : null}
          </div>
        ) : null}

        {view === 'confirm-clear' ? (
          <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>
              {lockedPlanCount > 0
                ? `Bạn đang khóa ${lockedPlanCount} kế hoạch cho riêng mình bằng mã này. Xóa mã sẽ tắt khóa ở tất cả các kế hoạch đó.`
                : 'Bạn có chắc muốn xóa mã bảo mật cá nhân này?'}
            </p>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setView('status')} variant="ghost">
                Hủy
              </Button>
              <Button
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={isClearing}
                onClick={handleClearPasscode}
              >
                {isClearing ? 'Đang xóa...' : 'Xóa mã bảo mật'}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </BottomSheet>
  );
}
