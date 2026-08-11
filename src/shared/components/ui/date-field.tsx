'use client';

import { CalendarDays } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

import { Input } from '@/shared/components/ui/input';

type DateFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export function DateField({ className, ...props }: DateFieldProps) {
  return (
    <div className="relative">
      <Input
        className={`min-h-11 pr-11 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-11 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 ${className ?? ''}`}
        type="date"
        {...props}
      />
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[var(--color-subtle)]">
        <CalendarDays className="size-4" />
      </span>
    </div>
  );
}
