import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Section } from '@/shared/components/ui/section';

describe('Section', () => {
  it('renders title and children without a header when title is omitted', () => {
    const withTitle = renderToStaticMarkup(<Section title="Title text">Body content</Section>);
    expect(withTitle).toContain('Title text');
    expect(withTitle).toContain('Body content');

    const withoutTitle = renderToStaticMarkup(<Section>Body only</Section>);
    expect(withoutTitle).toContain('Body only');
    expect(withoutTitle).not.toContain('<h2');
  });

  it('renders optional eyebrow, description and action only when provided', () => {
    const withExtras = renderToStaticMarkup(
      <Section action={<button type="button">Xem tất cả</button>} description="Description text" eyebrow="Eyebrow" title="Title">
        Content
      </Section>,
    );
    expect(withExtras).toContain('Eyebrow');
    expect(withExtras).toContain('Description text');
    expect(withExtras).toContain('Xem tất cả');

    const withoutExtras = renderToStaticMarkup(<Section title="Title">Content</Section>);
    expect(withoutExtras).not.toContain('Eyebrow');
  });

  it('does not inject Card chrome by default', () => {
    const html = renderToStaticMarkup(<Section title="Title">Content</Section>);
    expect(html).not.toContain('shadow');
    expect(html).not.toMatch(/\bborder\b/);
  });

  it('preserves custom attributes passed through', () => {
    const html = renderToStaticMarkup(
      <Section data-testid="my-section" title="Title">
        Content
      </Section>,
    );
    expect(html).toContain('data-testid="my-section"');
  });
});
