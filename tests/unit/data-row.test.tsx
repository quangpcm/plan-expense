import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { DataRow } from '@/shared/components/ui/data-row';

describe('DataRow', () => {
  it('renders leading, main, status and trailing slots', () => {
    const html = renderToStaticMarkup(
      <DataRow
        leading={<span>leading-content</span>}
        main={<span>main-content</span>}
        status={<span>status-content</span>}
        trailing={<span>trailing-content</span>}
      />,
    );
    expect(html).toContain('leading-content');
    expect(html).toContain('main-content');
    expect(html).toContain('status-content');
    expect(html).toContain('trailing-content');
  });

  it('is non-interactive by default (renders a div, not a button)', () => {
    const html = renderToStaticMarkup(<DataRow main="Main content" />);
    expect(html).toMatch(/^<div/);
    expect(html).not.toContain('<button');
  });

  it('becomes a real button only when onClick is provided', () => {
    const html = renderToStaticMarkup(<DataRow main="Main content" onClick={() => {}} />);
    expect(html).toContain('<button');
  });

  it('applies a selected-state class distinct from the unselected state', () => {
    const unselected = renderToStaticMarkup(<DataRow main="Content" />);
    const selected = renderToStaticMarkup(<DataRow main="Content" selected />);
    expect(unselected).not.toEqual(selected);
  });

  it('supports comfortable and compact density without throwing', () => {
    for (const density of ['comfortable', 'compact'] as const) {
      expect(() => renderToStaticMarkup(<DataRow density={density} main="Content" />)).not.toThrow();
    }
  });
});
