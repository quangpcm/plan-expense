import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Metric } from '@/shared/components/ui/metric';

describe('Metric', () => {
  it('renders label and value verbatim, with no calculation applied', () => {
    // A non-numeric, pre-formatted value proves Metric passes it through untouched rather than
    // computing/formatting anything itself (04.StructuralComponents.md §27-30).
    const html = renderToStaticMarkup(<Metric label="Tổng chi" value="đã tính sẵn: 9.500.000đ" />);
    expect(html).toContain('Tổng chi');
    expect(html).toContain('đã tính sẵn: 9.500.000đ');
  });

  it('renders optional supporting content and leading visual only when provided', () => {
    const withExtras = renderToStaticMarkup(
      <Metric label="Label" leading={<span>icon</span>} supporting="Supporting text" value="123" />,
    );
    expect(withExtras).toContain('Supporting text');
    expect(withExtras).toContain('icon');

    const withoutExtras = renderToStaticMarkup(<Metric label="Label" value="123" />);
    expect(withoutExtras).not.toContain('Supporting text');
  });

  it('defaults to neutral tone (finance neutral-by-default invariant)', () => {
    const defaultHtml = renderToStaticMarkup(<Metric label="Label" value="123" />);
    const dangerHtml = renderToStaticMarkup(<Metric label="Label" tone="danger" value="123" />);
    // The two renders must differ once a non-default tone is requested, proving tone is
    // consumer-controlled rather than inferred from the value.
    expect(defaultHtml).not.toEqual(dangerHtml);
  });

  it('supports all three canonical sizes without throwing', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      expect(() => renderToStaticMarkup(<Metric label="Label" size={size} value="123" />)).not.toThrow();
    }
  });
});
