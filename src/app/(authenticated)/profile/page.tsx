'use client';

import { useState } from 'react';

import { useAuthActions } from '@/modules/auth/hooks/use-auth-actions';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { useArchivedPlans } from '@/modules/plan/hooks/use-archived-plans';
import { useUserPlans } from '@/modules/plan/hooks/use-user-plans';
import { DisplayNameSheet } from '@/modules/user/components/display-name-sheet';
import { PasscodeSheet } from '@/modules/user/components/passcode-sheet';
import { useCurrentUserProfile } from '@/modules/user/hooks/use-current-user-profile';
import { appRoutes } from '@/shared/constants/app-routes';
import { Avatar } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { SettingsGroup } from '@/shared/components/ui/settings-group';
import { SettingsRow } from '@/shared/components/ui/settings-row';

export default function ProfilePage() {
  const { user } = useAuthSession();
  const { logout } = useAuthActions();
  const { userProfile } = useCurrentUserProfile();
  const { plans } = useUserPlans();
  const { plans: archivedPlans } = useArchivedPlans();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showNameSheet, setShowNameSheet] = useState(false);
  const [showPasscodeSheet, setShowPasscodeSheet] = useState(false);
  const lockedPlanCount = plans.filter((plan) => plan.isLocked).length;
  const hasPasscode = Boolean(userProfile?.secretNumberHash);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <main className="flex flex-col gap-5">
      <div className="flex items-center gap-4 px-1">
        <Avatar
          className="size-14 text-base"
          initials={(user?.displayName || 'PE').slice(0, 2).toUpperCase()}
          src={userProfile?.avatarUrl ?? user?.photoURL ?? null}
        />
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">{user?.displayName || 'User'}</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">{user?.email || 'No email found'}</p>
        </div>
      </div>

      <SettingsGroup title="Tài khoản">
        <SettingsRow label="Tên hiển thị" onClick={() => setShowNameSheet(true)} value={user?.displayName || '—'} />
      </SettingsGroup>

      <SettingsGroup title="Bảo mật">
        <SettingsRow
          label="Mã bảo mật cá nhân"
          onClick={() => setShowPasscodeSheet(true)}
          value={hasPasscode ? 'Đã thiết lập' : 'Chưa đặt'}
        />
      </SettingsGroup>

      <SettingsGroup title="Dữ liệu & kế hoạch">
        <SettingsRow badge={archivedPlans.length} href={appRoutes.archivedPlans} label="Kế hoạch đã lưu trữ" />
      </SettingsGroup>

      <Button className="w-full" disabled={isLoggingOut} onClick={handleLogout} variant="ghost">
        {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
      </Button>

      <p className="text-center text-xs text-[var(--color-text-muted)]">Go Plan · Phiên bản 1.0.0</p>

      <DisplayNameSheet onClose={() => setShowNameSheet(false)} open={showNameSheet} />
      {user ? (
        <PasscodeSheet
          hasPasscode={hasPasscode}
          lockedPlanCount={lockedPlanCount}
          onClose={() => setShowPasscodeSheet(false)}
          open={showPasscodeSheet}
          userId={user.uid}
        />
      ) : null}
    </main>
  );
}
