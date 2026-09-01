'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Check, Computer, LogOut, Moon, Settings, Sun, UserCircle2 } from 'lucide-react';
import { useTheme } from 'next-themes';

import { useAuthActions } from '@/modules/auth/hooks/use-auth-actions';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { useCurrentUserProfile } from '@/modules/user/hooks/use-current-user-profile';
import { Avatar } from '@/shared/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isMounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Người dùng';
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarSrc = userProfile?.avatarUrl ?? user?.photoURL ?? null;
  const activeTheme = theme === 'system' ? 'system' : resolvedTheme === 'dark' ? 'dark' : 'light';

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
          className="shrink-0 rounded-full text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-default)]"
          type="button"
        >
          <Avatar className="size-10" initials={initials} src={avatarSrc} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="size-10 shrink-0" initials={initials} src={avatarSrc} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{displayName}</p>
            <p className="truncate text-xs text-[var(--color-text-secondary)]">{user?.email || ''}</p>
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
        <div className="px-1 py-1">
          <DropdownMenuLabel className="px-2 pb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            Giao diện
          </DropdownMenuLabel>
          <DropdownMenuItem
            className="justify-between"
            onSelect={() => setTheme('system')}
          >
            <span className="flex items-center gap-3">
              <Computer className="size-4 shrink-0" />
              Hệ thống
            </span>
            {isMounted && activeTheme === 'system' ? <Check className="size-4 shrink-0" /> : null}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="justify-between"
            onSelect={() => setTheme('light')}
          >
            <span className="flex items-center gap-3">
              <Sun className="size-4 shrink-0" />
              Sáng
            </span>
            {isMounted && activeTheme === 'light' ? <Check className="size-4 shrink-0" /> : null}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="justify-between"
            onSelect={() => setTheme('dark')}
          >
            <span className="flex items-center gap-3">
              <Moon className="size-4 shrink-0" />
              Tối
            </span>
            {isMounted && activeTheme === 'dark' ? <Check className="size-4 shrink-0" /> : null}
          </DropdownMenuItem>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive disabled={isLoggingOut} onSelect={handleLogout}>
          <LogOut className="size-4 shrink-0" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
