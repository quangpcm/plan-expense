'use client';

import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Drawer } from 'vaul';

import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { cn } from '@/shared/utils/cn';

type ResponsiveModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string | undefined;
  children?: ReactNode;
  className?: string | undefined;
};

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: ResponsiveModalProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return (
      <Dialog.Root onOpenChange={onOpenChange} open={open}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/40 data-[state=closed]:animate-overlay-hide data-[state=open]:animate-overlay-show" />
          <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
            <Dialog.Content
              className={cn(
                'relative w-full rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_60px_rgba(15,23,42,0.1)] focus:outline-none data-[state=closed]:animate-content-hide data-[state=open]:animate-content-show',
                className,
              )}
            >
              <div className="space-y-1">
                <Dialog.Title className="text-lg font-semibold text-slate-950">
                  {title}
                </Dialog.Title>
                {description ? (
                  <Dialog.Description className="text-sm leading-6 text-slate-600">
                    {description}
                  </Dialog.Description>
                ) : (
                  <Dialog.Description className="sr-only">{title}</Dialog.Description>
                )}
              </div>
              {children ? <div className="mt-4">{children}</div> : null}
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Drawer.Root onOpenChange={onOpenChange} open={open}>
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 z-40 bg-slate-950/40"
          onClick={() => onOpenChange(false)}
        />
        <Drawer.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-40 flex max-h-[85vh] flex-col overflow-hidden rounded-t-[32px] border border-b-0 border-slate-200 bg-white p-5 shadow-[0_-16px_60px_rgba(15,23,42,0.08)] focus:outline-none',
            className,
          )}
        >
          <div className="mx-auto mb-4 h-1.5 w-14 shrink-0 rounded-full bg-slate-200" />
          <div className="shrink-0">
            <Drawer.Title className="text-lg font-semibold text-slate-950">{title}</Drawer.Title>
            {description ? (
              <Drawer.Description className="mt-1 text-sm leading-6 text-slate-600">
                {description}
              </Drawer.Description>
            ) : (
              <Drawer.Description className="sr-only">{title}</Drawer.Description>
            )}
          </div>
          {children ? (
            <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
              {children}
            </div>
          ) : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
