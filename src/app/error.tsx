'use client';

import { useEffect } from 'react';

import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-status-danger)]">App Error</p>
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Something went wrong.</h1>
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            The application hit an unexpected state while rendering this screen.
          </p>
        </div>
        <div className="flex justify-center">
          <Button onClick={reset}>Try again</Button>
        </div>
      </Card>
    </main>
  );
}
