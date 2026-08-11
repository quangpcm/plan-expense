import type { TextareaHTMLAttributes } from 'react';

import { cn } from '@/shared/utils/cn';

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-28 w-full rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-sm text-[var(--color-foreground)] outline-none transition placeholder:text-[var(--color-subtle)] focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent-soft)]',
        className,
      )}
      {...props}
    />
  );
}
