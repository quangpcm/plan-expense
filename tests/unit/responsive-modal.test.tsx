import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ResponsiveModal } from '@/shared/components/ui/responsive-modal';

// Both Dialog.Portal and Drawer.Portal render their content into a React portal, which
// renderToStaticMarkup (this project's existing test stack — no jsdom/@testing-library) excludes
// entirely from its output by design (portal content is not part of the SSR string in any React
// version). That rules out asserting on title/close-button/children markup here; these tests can
// only guard the render-without-throwing contract for both the open and closed states.
//
// The behavior actually fixed alongside these tests — focus returning to the external trigger on
// close — requires a real DOM/focus lifecycle and was verified with browser-driven keyboard
// interaction instead; see
// docs/design-sys-v2/implement-specs/reports/03.OverlayArchitecture.FocusReturnFix.Report.md
// ("Browser verification") for that evidence.
describe('ResponsiveModal', () => {
  it('renders without throwing when open', () => {
    expect(() =>
      renderToStaticMarkup(
        <ResponsiveModal onOpenChange={() => {}} open title="Tạo kế hoạch mới">
          <div>Modal content</div>
        </ResponsiveModal>,
      ),
    ).not.toThrow();
  });

  it('renders without throwing with a description', () => {
    expect(() =>
      renderToStaticMarkup(
        <ResponsiveModal description="Mô tả chi tiết" onOpenChange={() => {}} open title="Title">
          <div>Content</div>
        </ResponsiveModal>,
      ),
    ).not.toThrow();
  });

  it('renders without throwing when closed', () => {
    expect(() =>
      renderToStaticMarkup(
        <ResponsiveModal onOpenChange={() => {}} open={false} title="Title">
          <div>Content</div>
        </ResponsiveModal>,
      ),
    ).not.toThrow();
  });
});
