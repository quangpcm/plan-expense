import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

type FilterBarProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  search?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
};

/**
 * Generic layout for search + filter controls + reset/action region. FilterBar does not own
 * filter state, filter definitions, search debounce/query logic, or domain filter meaning
 * (05.CorePatterns.md §28-31) — it only arranges whatever controls the product composes into it.
 * No filter schema/DSL prop exists by design; compose real controls (Input, DropdownSelect, ...)
 * into the `search`/`filters`/`actions` slots instead.
 */
export function FilterBar({ search, filters, actions, className, ...props }: FilterBarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} {...props}>
      {search ? <div className="min-w-0 flex-1">{search}</div> : null}
      {filters ? <div className="flex flex-wrap items-center gap-2">{filters}</div> : null}
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
