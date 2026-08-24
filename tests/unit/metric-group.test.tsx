import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Metric } from '@/shared/components/ui/metric';
import { MetricGroup } from '@/shared/components/ui/metric-group';

describe('MetricGroup', () => {
  it('renders composed Metric children via plain composition, not a data/config prop', () => {
    const html = renderToStaticMarkup(
      <MetricGroup>
        <Metric label="A" value="1" />
        <Metric label="B" value="2" />
        <Metric label="C" value="3" />
      </MetricGroup>,
    );
    expect(html).toContain('>A<');
    expect(html).toContain('>B<');
    expect(html).toContain('>C<');
  });

  it('applies a different layout class per columns option', () => {
    const twoCol = renderToStaticMarkup(
      <MetricGroup columns={2}>
        <Metric label="A" value="1" />
      </MetricGroup>,
    );
    const fourCol = renderToStaticMarkup(
      <MetricGroup columns={4}>
        <Metric label="A" value="1" />
      </MetricGroup>,
    );
    expect(twoCol).not.toEqual(fourCol);
  });

  it('applies a different gap class per density option', () => {
    const comfortable = renderToStaticMarkup(
      <MetricGroup density="comfortable">
        <Metric label="A" value="1" />
      </MetricGroup>,
    );
    const compact = renderToStaticMarkup(
      <MetricGroup density="compact">
        <Metric label="A" value="1" />
      </MetricGroup>,
    );
    expect(comfortable).not.toEqual(compact);
  });

  it('renders as a plain container with no default children required beyond composition', () => {
    const html = renderToStaticMarkup(<MetricGroup>{null}</MetricGroup>);
    expect(html).toContain('<div');
  });
});
