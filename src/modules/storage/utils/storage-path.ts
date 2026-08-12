import type { RequestUploadUrlInput } from '@/modules/storage/types/storage';

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'application/pdf': 'pdf',
};

export function resolveFileExtension(fileName: string, contentType: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(fileName);

  if (match) {
    return match[1]!.toLowerCase();
  }

  return EXTENSION_BY_MIME_TYPE[contentType] ?? 'bin';
}

export function buildStoragePath(input: RequestUploadUrlInput, fileId: string): string {
  const extension = resolveFileExtension(input.fileName, input.contentType);

  switch (input.mediaType) {
    case 'avatar':
      return `users/${input.userId}/avatar/${fileId}.${extension}`;
    case 'plan-cover':
      return `plans/${input.planId}/cover/${fileId}.${extension}`;
    case 'expense-attachment':
      return `plans/${input.planId}/expenses/${input.expenseId}/${fileId}.${extension}`;
    case 'income-attachment':
      return `plans/${input.planId}/incomes/${input.incomeId}/${fileId}.${extension}`;
    case 'settlement-attachment':
      return `plans/${input.planId}/settlements/${input.settlementId}/${fileId}.${extension}`;
  }
}
