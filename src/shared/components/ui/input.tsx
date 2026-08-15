import type { InputHTMLAttributes, Ref } from 'react';

import { cn } from '@/shared/utils/cn';

export function Input({ className, ref, ...props }: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return (
    <input
      className={cn(
        'min-h-11 w-full rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition placeholder:text-[var(--color-subtle)] focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent-soft)]',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
}
