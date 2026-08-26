'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LogOut, Settings, UserCircle2 } from 'lucide-react';

import { useAuthActions } from '@/modules/auth/hooks/use-auth-actions';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { useCurrentUserProfile } from '@/modules/user/hooks/use-current-user-profile';
import { Avatar } from '@/shared/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { appRoutes } from '@/shared/constants';

// Global header's account entry point. "Cá nhân" has no unique workspace content of its own — the
// whole page is account/profile/settings chrome (display name, passcode, archived plans, logout) —
// so it belongs here as menu items, not as a primary top-level nav destination.
export function AccountMenu() {
  const { user } = useAuthSession();
  const { logout } = useAuthActions();
  const { userProfile } = useCurrentUserProfile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Người dùng';
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarSrc = userProfile?.avatarUrl ?? user?.photoURL ?? null;

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Tài khoản"
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2"
          type="button"
        >
          <Avatar className="size-10" initials={initials} src={avatarSrc} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="size-10 shrink-0" initials={initials} src={avatarSrc} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--color-foreground)]">{displayName}</p>
            <p className="truncate text-xs text-[var(--color-muted)]">{user?.email || ''}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={appRoutes.profile}>
            <UserCircle2 className="size-4 shrink-0" />
            Hồ sơ cá nhân
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={appRoutes.settings}>
            <Settings className="size-4 shrink-0" />
            Cài đặt
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive disabled={isLoggingOut} onSelect={handleLogout}>
          <LogOut className="size-4 shrink-0" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
