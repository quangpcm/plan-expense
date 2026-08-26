'use client';

import * as RadixDropdownMenu from '@radix-ui/react-dropdown-menu';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';

import { cn } from '@/shared/utils/cn';

export const DropdownMenu = RadixDropdownMenu.Root;
export const DropdownMenuTrigger = RadixDropdownMenu.Trigger;

export const DropdownMenuContent = forwardRef<
  ElementRef<typeof RadixDropdownMenu.Content>,
  ComponentPropsWithoutRef<typeof RadixDropdownMenu.Content>
>(function DropdownMenuContent({ className, sideOffset = 8, align = 'end', ...props }, ref) {
  return (
    <RadixDropdownMenu.Portal>
      <RadixDropdownMenu.Content
        align={align}
        className={cn(
          'z-[var(--z-index-dropdown)] w-64 rounded-[var(--radius-ds-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-overlay)] focus:outline-none data-[state=closed]:animate-content-hide data-[state=open]:animate-content-show',
          className,
        )}
        ref={ref}
        sideOffset={sideOffset}
        {...props}
      />
    </RadixDropdownMenu.Portal>
  );
});

export const DropdownMenuItem = forwardRef<
  ElementRef<typeof RadixDropdownMenu.Item>,
  ComponentPropsWithoutRef<typeof RadixDropdownMenu.Item> & { destructive?: boolean }
>(function DropdownMenuItem({ className, destructive, ...props }, ref) {
  return (
    <RadixDropdownMenu.Item
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-ds-md)] px-3 text-sm font-medium outline-none transition data-[highlighted]:bg-[var(--color-surface-soft)]',
        destructive ? 'text-[var(--color-status-danger)]' : 'text-[var(--color-foreground)]',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

export const DropdownMenuSeparator = forwardRef<
  ElementRef<typeof RadixDropdownMenu.Separator>,
  ComponentPropsWithoutRef<typeof RadixDropdownMenu.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return <RadixDropdownMenu.Separator className={cn('my-1 h-px bg-[var(--color-border)]', className)} ref={ref} {...props} />;
});

export const DropdownMenuLabel = RadixDropdownMenu.Label;
