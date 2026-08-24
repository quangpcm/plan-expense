import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { EmptyState } from '@/shared/components/ui/empty-state';
import { ErrorState } from '@/shared/components/ui/error-state';

describe('ErrorState', () => {
  it('renders title', () => {
    const html = renderToStaticMarkup(<ErrorState title="Không thể tải dữ liệu" />);
    expect(html).toContain('Không thể tải dữ liệu');
  });

  it('renders description and visual only when provided', () => {
    const withExtras = renderToStaticMarkup(
      <ErrorState description="Description text" title="Title" visual={<span>icon</span>} />,
    );
    expect(withExtras).toContain('Description text');
    expect(withExtras).toContain('icon');

    const withoutExtras = renderToStaticMarkup(<ErrorState title="Title" />);
    expect(withoutExtras).not.toContain('Description text');
  });

  it('does not assume a retry action — renders whatever action the consumer supplies', () => {
    const html = renderToStaticMarkup(
      <ErrorState action={<button type="button">Yêu cầu quyền truy cập</button>} title="Title" />,
    );
    expect(html).toContain('Yêu cầu quyền truy cập');
    expect(html).not.toContain('Thử lại');
  });

  it('works without a retry/action at all', () => {
    expect(() => renderToStaticMarkup(<ErrorState title="Title" />)).not.toThrow();
  });

  it('remains a distinct component from EmptyState, not a shared "State" component', () => {
    expect(ErrorState).not.toBe(EmptyState);
  });
});
