'use client';

import { CalendarDays } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

import { cn } from '@/shared/utils/cn';
import { formatDateTimePickerDisplay, parseDateTimeLocalInput } from '@/shared/utils/date';

type DateTimeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  value?: string;
  placeholder?: string;
};

export function DateTimeInput({
  className,
  value,
  placeholder = 'Chọn thời gian',
  disabled,
  id,
  ...props
}: DateTimeInputProps) {
  const parsedDate = parseDateTimeLocalInput(value);
  const displayValue = parsedDate ? formatDateTimePickerDisplay(parsedDate) : placeholder;

  return (
    <div
      className={cn(
        'relative min-h-11 w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)]',
        disabled ? 'opacity-60' : '',
        className,
      )}
    >
      <div className="pointer-events-none flex min-h-11 items-center justify-between gap-3 px-4 py-2.5 text-sm">
        <span className={cn('truncate text-[var(--color-foreground)]', !parsedDate ? 'text-[var(--color-subtle)]' : '')}>
          {displayValue}
        </span>
        <CalendarDays className="size-4 shrink-0 text-[var(--color-subtle)]" />
      </div>
      <input
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 outline-none"
        disabled={disabled}
        id={id}
        type="datetime-local"
        value={value}
        {...props}
      />
    </div>
  );
}
