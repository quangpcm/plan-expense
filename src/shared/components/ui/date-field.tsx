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
        // The real focusable element is the hidden <input> below (opaque-0, covers this div) —
        // it previously had no visible focus indicator at all. `has-[:focus-visible]` puts the
        // canonical ring on this wrapper instead, since the input itself is invisible.
        'relative min-h-11 w-full overflow-hidden rounded-[var(--radius-ds-lg)] border border-[var(--color-border-default)] bg-[color:var(--color-surface-default)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--color-focus-ring)] has-[:focus-visible]:ring-offset-2',
        disabled ? 'opacity-60' : '',
        className,
      )}
    >
      <div className="pointer-events-none flex min-h-11 items-center justify-between gap-3 px-4 py-2.5 text-sm">
        <span className={cn('truncate text-[var(--color-text-primary)]', !parsedDate ? 'text-[var(--color-text-muted)]' : '')}>
          {displayValue}
        </span>
        <CalendarDays className="size-4 shrink-0 text-[var(--color-text-muted)]" />
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
