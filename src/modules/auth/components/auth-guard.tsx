'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { appRoutes } from '@/shared/constants';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { FirebaseSetupNotice } from '@/modules/auth/components/firebase-setup-notice';
import { Skeleton } from '@/shared/components/ui/skeleton';

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { initialized, status } = useAuthSession();

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (status === 'unauthenticated') {
      router.replace(`${appRoutes.login}?next=${encodeURIComponent(pathname)}`);
    }
  }, [initialized, pathname, router, status]);

  if (!initialized || status === 'loading' || status === 'idle') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6">
        <Skeleton className="h-24 rounded-[28px]" />
        <Skeleton className="h-32 rounded-[28px]" />
        <Skeleton className="h-80 rounded-[28px]" />
      </main>
    );
  }

  if (status === 'unconfigured') {
    return <FirebaseSetupNotice />;
  }

  if (status !== 'authenticated') {
    return null;
  }

  return children;
}

