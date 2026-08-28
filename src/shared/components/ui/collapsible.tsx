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
  // Rendered as a DOM sibling immediately before the trigger button, never inside it — lets a
  // consumer place its own interactive control (e.g. an avatar-change button) next to the trigger
  // without nesting one <button> inside another (invalid HTML, breaks hydration, and would let a
  // click on that control bubble into the trigger's own onClick and toggle the row too).
  leading?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
};

export function Collapsible({
  title,
  description,
  icon,
  header,
  leading,
  defaultOpen = false,
  className,
  children,
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        {leading}
        <button
          type="button"
          className="flex min-h-11 flex-1 items-center justify-between gap-3 text-left"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((value) => !value)}
        >
          <span className="min-w-0 flex-1">
            {header ?? (
              <span className="flex items-start gap-3">
                {icon ? <span className="mt-0.5 text-[var(--color-text-secondary)]">{icon}</span> : null}
                <span className="space-y-1">
                  <span className="block text-lg font-semibold text-[var(--color-text-primary)]">{title}</span>
                  {description ? (
                    <span className="block text-sm text-[var(--color-text-secondary)]">{description}</span>
                  ) : null}
                </span>
              </span>
            )}
          </span>
          <ChevronDown
            className={cn(
              'size-5 shrink-0 text-[var(--color-text-muted)] transition-transform duration-200',
              isOpen ? 'rotate-180' : 'rotate-0',
            )}
          />
        </button>
      </div>
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
