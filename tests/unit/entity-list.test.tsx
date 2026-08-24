import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { EntityList } from '@/shared/components/ui/entity-list';

describe('EntityList', () => {
  it('renders children when no loading/error/empty slot is active', () => {
    const html = renderToStaticMarkup(
      <EntityList>
        <div>Row A</div>
        <div>Row B</div>
      </EntityList>,
    );
    expect(html).toContain('Row A');
    expect(html).toContain('Row B');
  });

  it('renders the loading slot instead of children when provided', () => {
    const html = renderToStaticMarkup(
      <EntityList loading={<div>Loading placeholder</div>}>
        <div>Row A</div>
      </EntityList>,
    );
    expect(html).toContain('Loading placeholder');
    expect(html).not.toContain('Row A');
  });

  it('renders the error slot instead of children when provided', () => {
    const html = renderToStaticMarkup(
      <EntityList error={<div>Error message</div>}>
        <div>Row A</div>
      </EntityList>,
    );
    expect(html).toContain('Error message');
    expect(html).not.toContain('Row A');
  });

  it('renders the empty slot instead of children when provided', () => {
    const html = renderToStaticMarkup(
      <EntityList empty={<div>Nothing here</div>}>
        <div>Row A</div>
      </EntityList>,
    );
    expect(html).toContain('Nothing here');
    expect(html).not.toContain('Row A');
  });

  it('prioritizes loading over error over empty when more than one is supplied', () => {
    const html = renderToStaticMarkup(
      <EntityList empty={<div>Empty content</div>} error={<div>Error content</div>} loading={<div>Loading content</div>}>
        <div>Row A</div>
      </EntityList>,
    );
    expect(html).toContain('Loading content');
    expect(html).not.toContain('Error content');
    expect(html).not.toContain('Empty content');
  });

  it('does not require DataRow children — any repeated content works', () => {
    const html = renderToStaticMarkup(
      <EntityList>
        <article>Custom product row</article>
      </EntityList>,
    );
    expect(html).toContain('Custom product row');
  });

  it('applies a different class for divided vs non-divided content', () => {
    const divided = renderToStaticMarkup(
      <EntityList divided>
        <div>Row</div>
      </EntityList>,
    );
    const notDivided = renderToStaticMarkup(
      <EntityList>
        <div>Row</div>
      </EntityList>,
    );
    expect(divided).not.toEqual(notDivided);
  });

  it('applies a different class per density option', () => {
    const comfortable = renderToStaticMarkup(
      <EntityList density="comfortable">
        <div>Row</div>
      </EntityList>,
    );
    const compact = renderToStaticMarkup(
      <EntityList density="compact">
        <div>Row</div>
      </EntityList>,
    );
    expect(comfortable).not.toEqual(compact);
  });
});
