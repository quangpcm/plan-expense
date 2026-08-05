import type { ReactNode } from 'react';

import { PublicOnlyGuard } from '@/modules/auth/components/public-only-guard';

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return <PublicOnlyGuard>{children}</PublicOnlyGuard>;
}

