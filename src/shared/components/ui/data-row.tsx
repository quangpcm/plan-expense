import type { ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

const densityPaddingClassName = {
  comfortable: 'py-3.5',
  compact: 'py-2.5',
} as const;

type DataRowProps = {
  leading?: ReactNode;
  main: ReactNode;
  status?: ReactNode;
  trailing?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  density?: keyof typeof densityPaddingClassName;
  onClick?: () => void;
  className?: string;
};

/**
 * Reusable list-row anatomy: leading / main / status / trailing slots. DataRow knows nothing about
 * what it's displaying — no Guest, Member, Debt, Expense, RSVP, or permission concept
 * (04.StructuralComponents.md §40/§41). Product composition supplies content and decides meaning.
 *
 * Non-interactive by default (renders a <div>) — matches the Test requirement that DataRow
 * defaults to non-interactive (§100). Pass `onClick` for a whole-row action and it renders a real
 * `<button>` with focus-visible/hover states instead of a clickable div (§46). If trailing already
 * contains its own buttons/menu, prefer leaving the row non-interactive with explicit trailing
 * actions instead, to avoid nested-interactive conflicts.
 */
export function DataRow({
  leading,
  main,
  status,
  trailing,
  selected = false,
  disabled = false,
  density = 'comfortable',
  onClick,
  className,
}: DataRowProps) {
  const isInteractive = Boolean(onClick);

  const content = (
    <>
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">{main}</div>
      {status ? <div className="shrink-0">{status}</div> : null}
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </>
  );

  const rowClassName = cn(
    'flex w-full items-center gap-3 text-left',
    densityPaddingClassName[density],
    selected ? 'bg-[var(--color-brand-subtle)]' : '',
    isInteractive &&
      'rounded-[var(--radius-ds-md)] transition outline-none hover:bg-[var(--color-surface-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
    className,
  );

  if (isInteractive) {
    return (
      <button className={rowClassName} disabled={disabled} onClick={onClick} type="button">
        {content}
      </button>
    );
  }

  return <div className={rowClassName}>{content}</div>;
}
