import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { FilterBar } from '@/shared/components/ui/filter-bar';

describe('FilterBar', () => {
  it('renders search, filters and actions only when provided', () => {
    const full = renderToStaticMarkup(
      <FilterBar
        actions={<button type="button">Đặt lại</button>}
        filters={<select aria-label="Sort" />}
        search={<input aria-label="Search" />}
      />,
    );
    expect(full).toContain('Đặt lại');
    expect(full).toContain('aria-label="Sort"');
    expect(full).toContain('aria-label="Search"');

    const searchOnly = renderToStaticMarkup(<FilterBar search={<input aria-label="Search" />} />);
    expect(searchOnly).not.toContain('Đặt lại');
  });

  it('renders as a plain layout container with no filter schema/DSL involved', () => {
    // FilterBar has no `filters` prop that accepts an array/object — passing arbitrary
    // ReactNode composition is the only supported shape, which this simply confirms renders.
    const html = renderToStaticMarkup(
      <FilterBar
        filters={
          <>
            <select aria-label="A" />
            <select aria-label="B" />
          </>
        }
      />,
    );
    expect(html).toContain('aria-label="A"');
    expect(html).toContain('aria-label="B"');
  });

  it('works with none of its slots supplied', () => {
    expect(() => renderToStaticMarkup(<FilterBar />)).not.toThrow();
  });
});
