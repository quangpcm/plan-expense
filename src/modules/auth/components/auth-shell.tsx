import Link from 'next/link';
import type { ReactNode } from 'react';

import { appConfig } from '@/config/app.config';
import { Card } from '@/shared/components/ui/card';

type AuthShellProps = {
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
};

export function AuthShell({ title, description, footer, children }: AuthShellProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <div className="mb-5">
        <Link
          className="inline-flex rounded-full bg-[var(--color-brand-subtle)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-primary)]"
          href="/"
        >
          {appConfig.name}
        </Link>
      </div>
      <Card>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">{title}</h1>
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
        </div>
        {children}
      </Card>
      <div className="mt-5 text-center text-sm leading-6 text-[var(--color-text-secondary)]">{footer}</div>
    </main>
  );
}
