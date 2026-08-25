import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog';

// AlertDialog.Portal/Drawer.Portal both exclude their content from renderToStaticMarkup's output
// (see responsive-modal.test.tsx for the full explanation) — these tests guard the
// render-without-throwing contract only. The focus-return fix applied alongside these tests was
// verified via browser-driven keyboard interaction; see
// docs/design-sys-v2/implement-specs/reports/03.OverlayArchitecture.FocusReturnFix.Report.md.
describe('ConfirmDialog', () => {
  it('renders without throwing when open', () => {
    expect(() =>
      renderToStaticMarkup(<ConfirmDialog onOpenChange={() => {}} open title="Xác nhận xóa" />),
    ).not.toThrow();
  });

  it('renders without throwing with a confirm action', () => {
    expect(() =>
      renderToStaticMarkup(
        <ConfirmDialog confirmLabel="Xóa" onOpenChange={() => {}} open title="Title" />,
      ),
    ).not.toThrow();
  });

  it('renders without throwing when closed', () => {
    expect(() =>
      renderToStaticMarkup(<ConfirmDialog onOpenChange={() => {}} open={false} title="Title" />),
    ).not.toThrow();
  });
});
