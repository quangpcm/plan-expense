'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/shared/utils/cn';

export type DropdownOption = {
  value: string;
  label: string;
  icon?: LucideIcon;
};

type DropdownSelectProps = {
  id?: string;
  value: string;
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onValueChange: (value: string) => void;
};

export function DropdownSelect({
  id,
  value,
  options,
  placeholder = 'Chọn một mục',
  disabled = false,
  className,
  onValueChange,
}: DropdownSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          'flex min-h-11 w-full items-center justify-between rounded-[var(--radius-ds-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-default)] px-4 py-2.5 text-left text-sm text-[var(--color-text-primary)] outline-none transition focus-visible:border-[var(--color-border-focus)] focus-visible:ring-4 focus-visible:ring-[var(--color-focus-ring-soft)] disabled:cursor-not-allowed disabled:opacity-60',
          !selectedOption ? 'text-[var(--color-text-muted)]' : '',
        )}
        disabled={disabled}
        id={id}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selectedOption?.icon ? <selectedOption.icon className="size-4 shrink-0" /> : null}
          <span className="truncate">{selectedOption?.label ?? placeholder}</span>
        </span>
        <ChevronDown className={cn('size-4 shrink-0 text-[var(--color-text-muted)] transition', isOpen ? 'rotate-180' : '')} />
      </button>

      {isOpen ? (
        <div className="absolute z-[var(--z-index-dropdown)] mt-2 w-full overflow-hidden rounded-[var(--radius-ds-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[0_18px_50px_color-mix(in_srgb,var(--color-overlay-backdrop)_24%,transparent)]">
          <ul className="max-h-72 overflow-y-auto py-1" role="listbox">
            {options.map((option) => {
              const isSelected = option.value === value;
              const OptionIcon = option.icon;

              return (
                <li key={option.value}>
                  <button
                    aria-selected={isSelected}
                    className={cn(
                      'flex min-h-11 w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm transition hover:bg-[var(--color-brand-subtle)]',
                      isSelected ? 'text-[var(--color-brand-primary)]' : 'text-[var(--color-text-primary)]',
                    )}
                    onClick={() => {
                      onValueChange(option.value);
                      setIsOpen(false);
                    }}
                    role="option"
                    type="button"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {OptionIcon ? <OptionIcon className="size-4 shrink-0" /> : null}
                      <span className="truncate">{option.label}</span>
                    </span>
                    {isSelected ? <Check className="size-4 shrink-0" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
