import { AppError } from '@/shared/errors/app-error';

export const ALLOWED_MEDIA_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
] as const;

export const MAX_MEDIA_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

export function validateMediaUpload(contentType: string, size: number): void {
  if (!ALLOWED_MEDIA_MIME_TYPES.includes(contentType as (typeof ALLOWED_MEDIA_MIME_TYPES)[number])) {
    throw new AppError(`Unsupported file type: ${contentType}.`, 'MEDIA_UNSUPPORTED_TYPE', 400);
  }

  if (size <= 0 || size > MAX_MEDIA_UPLOAD_SIZE_BYTES) {
    throw new AppError('File size must be between 1 byte and 10 MB.', 'MEDIA_INVALID_SIZE', 400);
  }
}
