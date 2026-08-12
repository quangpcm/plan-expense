import { describe, expect, it } from 'vitest';

import { validateMediaUpload } from '@/modules/storage/utils/validate-media';
import { AppError } from '@/shared/errors/app-error';

describe('validateMediaUpload', () => {
  it('accepts an allowed image type within the size limit', () => {
    expect(() => validateMediaUpload('image/jpeg', 1024)).not.toThrow();
  });

  it('accepts a pdf within the size limit', () => {
    expect(() => validateMediaUpload('application/pdf', 1024)).not.toThrow();
  });

  it('rejects an unsupported mime type', () => {
    expect(() => validateMediaUpload('video/mp4', 1024)).toThrow(AppError);
  });

  it('rejects a file larger than 10 MB', () => {
    expect(() => validateMediaUpload('image/png', 10 * 1024 * 1024 + 1)).toThrow(AppError);
  });

  it('rejects a zero or negative size', () => {
    expect(() => validateMediaUpload('image/png', 0)).toThrow(AppError);
  });
});
