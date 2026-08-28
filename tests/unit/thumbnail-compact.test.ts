import { describe, expect, it } from 'vitest';

import { resolveVisibleThumbnails } from '@/shared/components/media/thumbnail-compact';

describe('resolveVisibleThumbnails', () => {
  it('0 photos: no visible, no hidden', () => {
    const result = resolveVisibleThumbnails([], 3);

    expect(result.visible).toHaveLength(0);
    expect(result.hiddenCount).toBe(0);
  });

  it('1 photo: one visible, no hidden', () => {
    const result = resolveVisibleThumbnails(['a'], 3);

    expect(result.visible).toEqual(['a']);
    expect(result.hiddenCount).toBe(0);
  });

  it('2 photos: two visible, no hidden', () => {
    const result = resolveVisibleThumbnails(['a', 'b'], 3);

    expect(result.visible).toEqual(['a', 'b']);
    expect(result.hiddenCount).toBe(0);
  });

  it('3 photos: three visible, no hidden', () => {
    const result = resolveVisibleThumbnails(['a', 'b', 'c'], 3);

    expect(result.visible).toEqual(['a', 'b', 'c']);
    expect(result.hiddenCount).toBe(0);
  });

  it('4 photos: three visible, hidden count is 1 (not the total)', () => {
    const result = resolveVisibleThumbnails(['a', 'b', 'c', 'd'], 3);

    expect(result.visible).toEqual(['a', 'b', 'c']);
    expect(result.hiddenCount).toBe(1);
  });

  it('6 photos: three visible, hidden count is 3 (not the total)', () => {
    const result = resolveVisibleThumbnails(['a', 'b', 'c', 'd', 'e', 'f'], 3);

    expect(result.visible).toEqual(['a', 'b', 'c']);
    expect(result.hiddenCount).toBe(3);
  });

  it('10 photos: hidden count is 7', () => {
    const result = resolveVisibleThumbnails(
      Array.from({ length: 10 }, (_, index) => index),
      3,
    );

    expect(result.visible).toEqual([0, 1, 2]);
    expect(result.hiddenCount).toBe(7);
  });

  it('preserves original order/index correspondence for the visible slice', () => {
    const photos = [{ id: 'p0' }, { id: 'p1' }, { id: 'p2' }, { id: 'p3' }];
    const result = resolveVisibleThumbnails(photos, 3);

    result.visible.forEach((photo, index) => {
      expect(photo).toBe(photos[index]);
    });
  });
});
