import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/shared/utils/cn';

const buttonVariants = {
  primary:
    'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[0_12px_28px_rgba(36,59,107,0.2)] hover:bg-[var(--color-primary-hover)] visited:text-[var(--color-primary-foreground)] active:text-[var(--color-primary-foreground)] focus:text-[var(--color-primary-foreground)]',
  secondary:
    'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_78%,white)]',
  ghost: 'bg-transparent text-[var(--color-secondary-foreground)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-info)]',
} as const;

type SharedButtonProps = {
  children: ReactNode;
  className?: string;
  variant?: keyof typeof buttonVariants;
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
  ...props
}: NativeButtonProps | LinkButtonProps) {
  const classes = cn(
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
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
