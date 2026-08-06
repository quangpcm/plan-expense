'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { AuthGuard } from '@/modules/auth/components/auth-guard';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { appRoutes } from '@/shared/constants';

function RedirectToPlans() {
  const router = useRouter();

  useEffect(() => {
    router.replace(appRoutes.plans);
  }, [router]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6">
      <Skeleton className="h-24 rounded-[28px]" />
      <Skeleton className="h-32 rounded-[28px]" />
      <Skeleton className="h-80 rounded-[28px]" />
    </main>
  );
}

export default function RootPage() {
  return (
    <AuthGuard>
      <RedirectToPlans />
    </AuthGuard>
  );
}
