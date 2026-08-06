'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/shared/utils/cn';

type CollapsibleProps = {
  title?: string;
  description?: string;
  icon?: ReactNode;
  header?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
};

export function Collapsible({
  title,
  description,
  icon,
  header,
  defaultOpen = false,
  className,
  children,
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <button
        type="button"
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        <span className="min-w-0 flex-1">
          {header ?? (
            <span className="flex items-start gap-3">
              {icon ? <span className="mt-0.5 text-slate-500">{icon}</span> : null}
              <span className="space-y-1">
                <span className="block text-lg font-semibold text-slate-950">{title}</span>
                {description ? (
                  <span className="block text-sm text-slate-600">{description}</span>
                ) : null}
              </span>
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'size-5 shrink-0 text-slate-400 transition-transform duration-200',
            isOpen ? 'rotate-180' : 'rotate-0',
          )}
        />
      </button>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="pt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
