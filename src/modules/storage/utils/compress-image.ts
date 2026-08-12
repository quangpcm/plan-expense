'use client';

const MAX_DIMENSION = 1600;
const TARGET_SIZE_BYTES = 1 * 1024 * 1024;
const MIN_QUALITY = 0.5;
const QUALITY_STEP = 0.1;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      resolve(image);
      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      reject(new Error('Image decode failed'));
      URL.revokeObjectURL(objectUrl);
    };

    image.src = objectUrl;
  });
}

function scaleToMaxDimension(width: number, height: number, maxDimension: number) {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  const scale = maxDimension / Math.max(width, height);

  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }

  try {
    const image = await loadImage(file);
    const { width, height } = scaleToMaxDimension(image.naturalWidth, image.naturalHeight, MAX_DIMENSION);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, width, height);

    let quality = 0.8;
    let blob = await canvasToBlob(canvas, quality);

    while (blob && blob.size > TARGET_SIZE_BYTES && quality > MIN_QUALITY) {
      quality -= QUALITY_STEP;
      blob = await canvasToBlob(canvas, quality);
    }

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const compressedName = `${file.name.replace(/\.\w+$/, '')}.jpg`;

    return new File([blob], compressedName, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
