import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { EmptyState } from '@/shared/components/ui/empty-state';

describe('EmptyState', () => {
  it('renders title', () => {
    const html = renderToStaticMarkup(<EmptyState title="Chưa có dữ liệu" />);
    expect(html).toContain('Chưa có dữ liệu');
  });

  it('renders description and visual only when provided', () => {
    const withExtras = renderToStaticMarkup(
      <EmptyState description="Description text" title="Title" visual={<span>icon</span>} />,
    );
    expect(withExtras).toContain('Description text');
    expect(withExtras).toContain('icon');

    const withoutExtras = renderToStaticMarkup(<EmptyState title="Title" />);
    expect(withoutExtras).not.toContain('Description text');
  });

  it('renders primary and secondary actions when provided', () => {
    const html = renderToStaticMarkup(
      <EmptyState
        action={<button type="button">Thêm mới</button>}
        secondaryAction={<button type="button">Bỏ qua</button>}
        title="Title"
      />,
    );
    expect(html).toContain('Thêm mới');
    expect(html).toContain('Bỏ qua');
  });

  it('works without any actions', () => {
    expect(() => renderToStaticMarkup(<EmptyState title="Title" />)).not.toThrow();
  });
});
