import type { TextareaHTMLAttributes } from 'react';

import { cn } from '@/shared/utils/cn';

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-28 w-full rounded-[var(--radius-ds-lg)] border border-[var(--color-border-default)] bg-[color:var(--color-surface-default)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-focus)] focus:ring-4 focus:ring-[var(--color-focus-ring-soft)]',
        className,
      )}
      {...props}
    />
  );
}
