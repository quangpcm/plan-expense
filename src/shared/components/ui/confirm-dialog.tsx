'use client';

import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Drawer } from 'vaul';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { Button } from '@/shared/components/ui/button';
import { useMediaQuery } from '@/shared/hooks/use-media-query';

type ConfirmDialogVariant = 'default' | 'destructive' | 'success';

const confirmButtonVariantClassName: Record<ConfirmDialogVariant, string | undefined> = {
  default: undefined,
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
};

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string | undefined;
  confirmLabel?: string;
  cancelLabel?: string;
  cancelVariant?: 'secondary' | 'ghost';
  onConfirm?: () => void;
  confirmVariant?: ConfirmDialogVariant;
  loading?: boolean;
  loadingLabel?: string;
  errorMessage?: string | undefined;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Hủy',
  cancelVariant = 'secondary',
  onConfirm,
  confirmVariant = 'default',
  loading = false,
  loadingLabel,
  errorMessage,
}: ConfirmDialogProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const footer = (
    <div className="mt-4 space-y-4">
      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      <div className="flex justify-end gap-2">
        <Button disabled={loading} onClick={() => onOpenChange(false)} variant={cancelVariant}>
          {cancelLabel}
        </Button>
        {confirmLabel ? (
          <Button
            disabled={loading}
            onClick={() => onConfirm?.()}
            {...(confirmButtonVariantClassName[confirmVariant]
              ? { className: confirmButtonVariantClassName[confirmVariant] }
              : {})}
          >
            {loading && loadingLabel ? loadingLabel : confirmLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );

  const titleBlock = (
    <div className="space-y-1">
      {isDesktop ? (
        <AlertDialog.Title className="text-lg font-semibold text-slate-950">
          {title}
        </AlertDialog.Title>
      ) : (
        <Drawer.Title className="text-lg font-semibold text-slate-950">{title}</Drawer.Title>
      )}
      {description ? (
        isDesktop ? (
          <AlertDialog.Description className="text-sm leading-6 text-slate-600">
            {description}
          </AlertDialog.Description>
        ) : (
          <Drawer.Description className="mt-1 text-sm leading-6 text-slate-600">
            {description}
          </Drawer.Description>
        )
      ) : isDesktop ? (
        <AlertDialog.Description className="sr-only">{title}</AlertDialog.Description>
      ) : (
        <Drawer.Description className="sr-only">{title}</Drawer.Description>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <AlertDialog.Root onOpenChange={onOpenChange} open={open}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40 data-[state=closed]:animate-overlay-hide data-[state=open]:animate-overlay-show" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <AlertDialog.Content
              className="relative w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_60px_rgba(15,23,42,0.1)] focus:outline-none data-[state=closed]:animate-content-hide data-[state=open]:animate-content-show"
              onEscapeKeyDown={(event) => event.preventDefault()}
            >
              {titleBlock}
              {footer}
            </AlertDialog.Content>
          </div>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    );
  }

  return (
    <Drawer.Root dismissible={false} onOpenChange={onOpenChange} open={open}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-slate-950/40" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col overflow-hidden rounded-t-[32px] border border-b-0 border-slate-200 bg-white p-5 shadow-[0_-16px_60px_rgba(15,23,42,0.08)] focus:outline-none"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <div className="mx-auto mb-4 h-1.5 w-14 shrink-0 rounded-full bg-slate-200" />
          {titleBlock}
          {footer}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
