const LOAD_TIMEOUT_MS = 8000;

export function readImageDimensions(source: File | string): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    let objectUrl: string | null = null;
    let src: string;

    if (typeof source === 'string') {
      src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      src = objectUrl;
    }

    const image = new Image();
    let settled = false;

    const timeoutId = setTimeout(() => {
      settle({ width: null, height: null });
    }, LOAD_TIMEOUT_MS);

    function settle(result: { width: number | null; height: number | null }) {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutId);

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }

      resolve(result);
    }

    image.onload = () => settle({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => settle({ width: null, height: null });
    image.src = src;
  });
}
