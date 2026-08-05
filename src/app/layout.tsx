import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@/styles/globals.css';
import { AppProviders } from '@/app/providers';

export const metadata: Metadata = {
  title: 'Plan Expense',
  description: 'Mini expense sharing web app for groups and shared plans.',
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
