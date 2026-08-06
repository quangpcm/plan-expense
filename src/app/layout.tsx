import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import '@/styles/globals.css';
import { AppProviders } from '@/app/providers';

export const metadata: Metadata = {
  title: 'Plan Expense',
  description: 'Mini expense sharing web app for groups and shared plans.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Plan Expense',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#020617',
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
