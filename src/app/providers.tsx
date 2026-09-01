'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';

import { AuthProvider } from '@/modules/auth/components/auth-provider';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
