import type { InputHTMLAttributes, Ref } from 'react';

import { cn } from '@/shared/utils/cn';

export function Input({ className, ref, ...props }: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return (
    <input
      className={cn(
        'min-h-11 w-full rounded-[var(--radius-ds-lg)] border border-[var(--color-border-default)] bg-[color:var(--color-surface-default)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-focus)] focus:ring-4 focus:ring-[var(--color-focus-ring-soft)]',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
}
