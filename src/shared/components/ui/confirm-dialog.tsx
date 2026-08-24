'use client';

import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Drawer } from 'vaul';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { Button } from '@/shared/components/ui/button';
import { useMediaQuery } from '@/shared/hooks/use-media-query';

type ConfirmDialogVariant = 'default' | 'destructive' | 'success';

// `destructive` now maps to Button's own native variant (added in Wave 2) instead of a manual
// className override — the two were already byte-identical (Wave 2 harvested this exact value
// from here). `success` has no Button-level equivalent (not one of the four minimum canonical
// variants), so it keeps its raw override for now.
const confirmButtonVariant: Record<ConfirmDialogVariant, 'primary' | 'destructive'> = {
  default: 'primary',
  destructive: 'destructive',
  success: 'primary',
};

const successButtonClassName = 'bg-emerald-600 text-white hover:bg-emerald-700';

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

  // Safe initial focus (destructive confirmation must not default focus onto the destructive
  // action). Desktop: wrapping Cancel in AlertDialog.Cancel activates Radix's own built-in
  // mechanism (AlertDialogContent hardcodes onOpenAutoFocus to focus whichever element is
  // registered as its internal cancelRef via AlertDialog.Cancel — this does nothing unless that
  // exact component is used, which the previous plain <Button> here did not do). Mobile: vaul's
  // Drawer has no equivalent — it defaults autoFocus to false and focuses nothing at all — so
  // Drawer.Content's own onOpenAutoFocus extension point is used to focus Cancel explicitly.
  const cancelButton = (
    <Button
      data-confirm-dialog-cancel=""
      disabled={loading}
      onClick={() => onOpenChange(false)}
      variant={cancelVariant}
    >
      {cancelLabel}
    </Button>
  );

  const footer = (
    <div className="mt-4 space-y-4">
      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      <div className="flex justify-end gap-2">
        {isDesktop ? <AlertDialog.Cancel asChild>{cancelButton}</AlertDialog.Cancel> : cancelButton}
        {confirmLabel ? (
          <Button
            disabled={loading}
            onClick={() => onConfirm?.()}
            variant={confirmButtonVariant[confirmVariant]}
            {...(confirmVariant === 'success' ? { className: successButtonClassName } : {})}
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
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-[var(--color-overlay-backdrop)] data-[state=closed]:animate-overlay-hide data-[state=open]:animate-overlay-show" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <AlertDialog.Content
              className="relative w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-5 shadow-[var(--shadow-overlay)] focus:outline-none data-[state=closed]:animate-content-hide data-[state=open]:animate-content-show"
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
        <Drawer.Overlay className="fixed inset-0 z-50 bg-[var(--color-overlay-backdrop)]" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col overflow-hidden rounded-t-[32px] border border-b-0 border-slate-200 bg-white p-5 shadow-[0_-16px_60px_rgba(15,23,42,0.08)] focus:outline-none"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            (event.currentTarget as HTMLElement)
              .querySelector<HTMLButtonElement>('[data-confirm-dialog-cancel]')
              ?.focus({ preventScroll: true });
          }}
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
