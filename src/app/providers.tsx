'use client';

import type { ReactNode } from 'react';

import { AuthProvider } from '@/modules/auth/components/auth-provider';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return <AuthProvider>{children}</AuthProvider>;
}

