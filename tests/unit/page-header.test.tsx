import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PageHeader } from '@/shared/components/ui/page-header';

describe('PageHeader', () => {
  it('renders title as a semantic h1', () => {
    const html = renderToStaticMarkup(<PageHeader title="Title text" />);
    expect(html).toContain('<h1');
    expect(html).toContain('Title text');
  });

  it('renders description, metadata and actions only when provided', () => {
    const withExtras = renderToStaticMarkup(
      <PageHeader
        actions={<button type="button">Thêm mới</button>}
        description="Description text"
        metadata={<span>Metadata text</span>}
        title="Title"
      />,
    );
    expect(withExtras).toContain('Description text');
    expect(withExtras).toContain('Metadata text');
    expect(withExtras).toContain('Thêm mới');

    const titleOnly = renderToStaticMarkup(<PageHeader title="Title" />);
    expect(titleOnly).not.toContain('Description text');
  });

  it('renders realistic long Vietnamese titles without throwing', () => {
    expect(() =>
      renderToStaticMarkup(
        <PageHeader
          description="Thêm và quản lý những người tham gia kế hoạch"
          title="Cân đối thành viên trong kế hoạch du lịch chung của cả nhóm"
        />,
      ),
    ).not.toThrow();
  });

  it('does not require any permission/route fixtures to render', () => {
    // No `role`, `module`, or route prop exists on PageHeader by design — only generic content.
    const html = renderToStaticMarkup(<PageHeader actions={<button type="button">Action</button>} title="Title" />);
    expect(html).toContain('Action');
  });
});
