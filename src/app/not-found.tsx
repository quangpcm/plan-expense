import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-status-info)]">404</p>
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Page not found.</h1>
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            This route is not available in the current phase of the application.
          </p>
        </div>
        <div className="flex justify-center">
          <Button href="/">Back to home</Button>
        </div>
      </Card>
    </main>
  );
}
