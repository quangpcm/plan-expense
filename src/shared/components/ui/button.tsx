import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

const buttonVariants = {
  primary:
    'bg-[var(--color-brand-primary)] text-[var(--color-brand-foreground)] shadow-[0_12px_28px_color-mix(in_srgb,var(--color-brand-primary)_24%,transparent)] hover:bg-[var(--color-brand-primary-hover)] active:bg-[var(--color-brand-primary-active)] visited:text-[var(--color-brand-foreground)] active:text-[var(--color-brand-foreground)] focus:text-[var(--color-brand-foreground)]',
  secondary:
    'border border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-default)]',
  ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-brand-subtle)] hover:text-[var(--color-brand-primary)]',
  // Harvested byte-for-byte from confirm-dialog.tsx's existing destructive className override
  // (bg-red-600 text-white hover:bg-red-700) — --color-status-danger equals Tailwind's red-600
  // exactly, so the base color is an exact rename. No shadow: the existing evidence doesn't have
  // one, and inventing a new colored shadow here would repeat the Wave 1 lesson about not adding
  // unsourced decorative values.
  destructive:
    'bg-[var(--color-status-danger)] text-[var(--color-text-inverse)] hover:bg-red-700 visited:text-[var(--color-text-inverse)] active:text-[var(--color-text-inverse)] focus:text-[var(--color-text-inverse)]',
} as const;

const buttonSizes = {
  // Unchanged from the pre-Wave-2 default — every existing consumer that doesn't pass `size`
  // keeps this exact appearance.
  md: 'min-h-11 gap-2 rounded-full px-5 py-2.5 text-sm',
  // Harvested from settlement-suggestion-card.tsx's existing manual size override. gap stays the
  // same as `md` — the original override never touched it, so keeping it avoids inventing a new
  // value on top of what was actually observed.
  sm: 'min-h-9 gap-2 rounded-full px-4 py-2 text-xs',
  // `icon` intentionally NOT added: unlike `sm`, there is no real icon-only Button consumer
  // anywhere in the repo to derive/verify it against (accessible-name + 44x44 touch target can't
  // be checked without one). Same consumer-evidence discipline already applied to `lg` — add both
  // only when a real consumer needs them.
} as const;

type SharedButtonProps = {
  children: ReactNode;
  className?: string;
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
};

type NativeButtonProps = SharedButtonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type LinkButtonProps = SharedButtonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: NativeButtonProps | LinkButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
    buttonSizes[size],
    buttonVariants[variant],
    className,
  );

  if ('href' in props && typeof props.href === 'string') {
    return (
      <Link className={classes} href={props.href}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} type="button" {...props}>
      {children}
    </button>
  );
}
