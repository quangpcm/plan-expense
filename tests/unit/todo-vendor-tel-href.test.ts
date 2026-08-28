import { describe, expect, it } from 'vitest';

import { toTelHref } from '@/modules/todo/utils/todo-display';

describe('toTelHref', () => {
  it('strips spaces from a local number', () => {
    expect(toTelHref('0905 123 456')).toBe('tel:0905123456');
  });

  it('strips dashes from a local number', () => {
    expect(toTelHref('0905-123-456')).toBe('tel:0905123456');
  });

  it('preserves a leading + for international numbers and strips separators', () => {
    expect(toTelHref('+84 905 123 456')).toBe('tel:+84905123456');
  });

  it('strips parentheses and dots', () => {
    expect(toTelHref('(028) 3.822.1234')).toBe('tel:02838221234');
  });

  it('ignores a + that is not in the leading position', () => {
    expect(toTelHref('0905+123+456')).toBe('tel:0905123456');
  });
});
