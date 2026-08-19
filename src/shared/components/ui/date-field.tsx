'use client';

import { CalendarDays } from 'lucide-react';
import type { InputHTMLAttributes, MouseEvent } from 'react';

import { cn } from '@/shared/utils/cn';
import { formatDate } from '@/shared/utils/date';

type DateFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  value?: string;
  placeholder?: string;
};

function parseDateInputValue(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function openPicker(event: MouseEvent<HTMLInputElement>) {
  // Trên desktop, browser chỉ tự mở picker khi click đúng icon lịch gốc (rất nhỏ vì input
  // đã bị kéo full-size và ẩn) — gọi showPicker() để bất kỳ click nào trong ô cũng mở được.
  if (typeof event.currentTarget.showPicker === 'function') {
    event.currentTarget.showPicker();
  }
}

export function DateField({
  className,
  value,
  placeholder = 'Chọn ngày',
  disabled,
  id,
  onClick,
  ...props
}: DateFieldProps) {
  const parsedDate = parseDateInputValue(value);
  const displayValue = parsedDate ? formatDate(parsedDate) : placeholder;

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
        onClick={(event) => {
          openPicker(event);
          onClick?.(event);
        }}
        type="date"
        value={value}
        {...props}
      />
    </div>
  );
}
