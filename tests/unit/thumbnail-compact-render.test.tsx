import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ThumbnailCompact, type ThumbnailCompactPhoto } from '@/shared/components/media/thumbnail-compact';

function makePhotos(count: number): ThumbnailCompactPhoto[] {
  return Array.from({ length: count }, (_, index) => ({ id: `p${index}`, url: `https://example.com/${index}.jpg` }));
}

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe('ThumbnailCompact', () => {
  it('0 photos: renders nothing', () => {
    const html = renderToStaticMarkup(<ThumbnailCompact photos={[]} />);

    expect(html).toBe('');
  });

  it('1 photo: renders exactly one thumbnail trigger, no +N', () => {
    const html = renderToStaticMarkup(<ThumbnailCompact photos={makePhotos(1)} />);

    expect(countOccurrences(html, '<button')).toBe(1);
    expect(html).toContain('Xem ảnh 1');
    expect(html).not.toContain('+');
  });

  it('2 photos: renders exactly two thumbnail triggers', () => {
    const html = renderToStaticMarkup(<ThumbnailCompact photos={makePhotos(2)} />);

    expect(countOccurrences(html, '<button')).toBe(2);
    expect(html).toContain('Xem ảnh 1');
    expect(html).toContain('Xem ảnh 2');
  });

  it('3 photos: renders exactly three thumbnail triggers, no +N', () => {
    const html = renderToStaticMarkup(<ThumbnailCompact photos={makePhotos(3)} />);

    expect(countOccurrences(html, '<button')).toBe(3);
    expect(html).toContain('Xem ảnh 3');
    expect(html).not.toContain('>+');
  });

  it('4 photos: renders only 3 triggers, shows "+1" (hidden count, not total)', () => {
    const html = renderToStaticMarkup(<ThumbnailCompact photos={makePhotos(4)} />);

    expect(countOccurrences(html, '<button')).toBe(3);
    expect(html).toContain('+1<');
    expect(html).not.toContain('+4<');
  });

  it('6 photos: renders only 3 triggers, shows "+3" (hidden count, not total)', () => {
    const html = renderToStaticMarkup(<ThumbnailCompact photos={makePhotos(6)} />);

    expect(countOccurrences(html, '<button')).toBe(3);
    expect(html).toContain('+3<');
    expect(html).not.toContain('+6<');
  });

  it('appends the optional ariaLabelSuffix to each accessible name', () => {
    const html = renderToStaticMarkup(
      <ThumbnailCompact ariaLabelSuffix="của Nancy House Grand" photos={makePhotos(2)} />,
    );

    expect(html).toContain('Xem ảnh 1 của Nancy House Grand');
    expect(html).toContain('Xem ảnh 2 của Nancy House Grand');
  });

  it('the +N overlay is scoped to the third (last visible) thumbnail', () => {
    const html = renderToStaticMarkup(<ThumbnailCompact photos={makePhotos(5)} />);
    const thirdButtonIndex = html.indexOf('Xem ảnh 3');
    const overlayIndex = html.indexOf('+2<');

    expect(thirdButtonIndex).toBeGreaterThan(-1);
    expect(overlayIndex).toBeGreaterThan(thirdButtonIndex);
  });
});
