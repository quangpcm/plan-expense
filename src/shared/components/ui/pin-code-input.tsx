'use client';

import { useEffect, useRef } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';

import { cn } from '@/shared/utils/cn';

type PinCodeInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
};

export function PinCodeInput({
  length = 4,
  value,
  onChange,
  onComplete,
  error = false,
  disabled = false,
  autoFocus = false,
}: PinCodeInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  function applyDigit(index: number, digit: string) {
    const chars = value.split('');
    chars[index] = digit;

    const next = chars.join('').slice(0, length);

    onChange(next);

    if (next.length === length) {
      onComplete?.(next);
    }
  }

  function handleChange(index: number, rawValue: string) {
    const digit = rawValue.replace(/\D/g, '').slice(-1);

    if (!digit) {
      applyDigit(index, '');
      return;
    }

    applyDigit(index, digit);

    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Backspace') {
      return;
    }

    if (value[index]) {
      return;
    }

    if (index > 0) {
      event.preventDefault();
      applyDigit(index - 1, '');
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);

    if (!pasted) {
      return;
    }

    event.preventDefault();
    onChange(pasted);

    if (pasted.length === length) {
      onComplete?.(pasted);
      inputRefs.current[length - 1]?.focus();
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  }

  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length }).map((_, index) => (
        <input
          autoComplete="one-time-code"
          className={cn(
            'size-14 rounded-2xl border text-center text-2xl font-semibold outline-none transition sm:size-16',
            error
              ? 'border-[var(--color-danger)] text-[var(--color-danger)] focus:ring-4 focus:ring-[var(--color-danger-soft)]'
              : 'border-[var(--color-border)] text-[var(--color-foreground)] focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent-soft)]',
          )}
          disabled={disabled}
          inputMode="numeric"
          key={index}
          maxLength={1}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          type="text"
          value={value[index] ?? ''}
        />
      ))}
    </div>
  );
}
