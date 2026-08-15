import type { RequestUploadUrlInput, RequestUploadUrlResult } from '@/modules/storage/types/storage';

export interface StorageRepository {
  requestUploadUrl(input: RequestUploadUrlInput): Promise<RequestUploadUrlResult>;
  deleteAttachments(input: { planId: string; storagePaths: string[] }): Promise<void>;
}
