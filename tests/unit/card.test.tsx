import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Card } from '@/shared/components/ui/card';

describe('Card', () => {
  it('renders children', () => {
    const html = renderToStaticMarkup(<Card>Card content</Card>);
    expect(html).toContain('Card content');
  });

  it('merges a custom className with its own', () => {
    const html = renderToStaticMarkup(<Card className="custom-class">Content</Card>);
    expect(html).toContain('custom-class');
  });

  it('adds no ARIA role by default', () => {
    const html = renderToStaticMarkup(<Card>Content</Card>);
    expect(html).not.toContain('role=');
  });

  it('passes through native div attributes', () => {
    const html = renderToStaticMarkup(<Card data-testid="my-card">Content</Card>);
    expect(html).toContain('data-testid="my-card"');
  });
});
