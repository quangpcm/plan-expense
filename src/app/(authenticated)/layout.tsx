import type { ReactNode } from 'react';

import { AuthGuard } from '@/modules/auth/components/auth-guard';
import { AppShell } from '@/shared/components/layout/app-shell';

type AuthenticatedLayoutProps = {
  children: ReactNode;
};

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}

