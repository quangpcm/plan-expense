import { useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/utils/cn';

type MilestoneSearchControlProps = {
  query: string;
  onQueryChange: (query: string) => void;
};

export function MilestoneSearchControl({ query, onQueryChange }: MilestoneSearchControlProps) {
  const [isManuallyOpen, setIsManuallyOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isOpen = isManuallyOpen || query.length > 0;

  function handleOpen() {
    setIsManuallyOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleClear() {
    onQueryChange('');
    setIsManuallyOpen(false);
  }

  function handleBlur() {
    if (!query) {
      setIsManuallyOpen(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-1 justify-end">
      <div
        className={cn(
          'relative flex items-center overflow-hidden transition-[width] duration-200 ease-out',
          isOpen ? 'w-full' : 'w-11',
        )}
      >
        <button
          aria-label="Tìm công việc"
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] transition-opacity duration-150',
            isOpen ? 'pointer-events-none opacity-0' : 'opacity-100',
          )}
          onClick={handleOpen}
          type="button"
        >
          <Search className="size-4" />
        </button>

        <div
          className={cn(
            'flex w-full min-w-0 items-center transition-opacity duration-150',
            isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-subtle)]" />
          <Input
            className="pl-10 pr-10"
            onBlur={handleBlur}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Tìm công việc..."
            ref={inputRef}
            value={query}
          />
          <button
            aria-label="Xoá tìm kiếm"
            className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-subtle)] transition hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-foreground)]"
            onClick={handleClear}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
