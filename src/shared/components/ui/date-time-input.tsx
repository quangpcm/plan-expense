'use client';

import { CalendarDays } from 'lucide-react';
import type { InputHTMLAttributes, MouseEvent } from 'react';

import { cn } from '@/shared/utils/cn';
import { formatDateTimePickerDisplay, parseDateTimeLocalInput } from '@/shared/utils/date';

type DateTimeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  value?: string;
  placeholder?: string;
};

function openPicker(event: MouseEvent<HTMLInputElement>) {
  // Trên desktop, browser chỉ tự mở picker khi click đúng icon lịch gốc (rất nhỏ vì input
  // đã bị kéo full-size và ẩn) — gọi showPicker() để bất kỳ click nào trong ô cũng mở được.
  if (typeof event.currentTarget.showPicker === 'function') {
    event.currentTarget.showPicker();
  }
}

export function DateTimeInput({
  className,
  value,
  placeholder = 'Chọn thời gian',
  disabled,
  id,
  onClick,
  ...props
}: DateTimeInputProps) {
  const parsedDate = parseDateTimeLocalInput(value);
  const displayValue = parsedDate ? formatDateTimePickerDisplay(parsedDate) : placeholder;

  return (
    <div
      className={cn(
        // Same rationale as DateField: the real focusable element is the hidden <input> below;
        // has-[:focus-visible] puts the canonical ring on this wrapper since the input is invisible.
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
        type="datetime-local"
        value={value}
        {...props}
      />
    </div>
  );
}
