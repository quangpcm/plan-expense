'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { appRoutes } from '@/shared/constants';
import { FirebaseSetupNotice } from '@/modules/auth/components/firebase-setup-notice';
import { Skeleton } from '@/shared/components/ui/skeleton';

type PublicOnlyGuardProps = {
  children: ReactNode;
};

export function PublicOnlyGuard({ children }: PublicOnlyGuardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { initialized, status } = useAuthSession();

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (status === 'authenticated') {
      const next = searchParams.get('next') || appRoutes.plans;
      router.replace(next);
    }
  }, [initialized, router, searchParams, status]);

  if (!initialized || status === 'loading' || status === 'idle') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-10 sm:px-6">
        <Skeleton className="h-10 w-28 rounded-full" />
        <Skeleton className="h-[420px] rounded-[32px]" />
      </main>
    );
  }

  if (status === 'unconfigured') {
    return <FirebaseSetupNotice />;
  }

  if (status === 'authenticated') {
    return null;
  }

  return children;
}

