import type { RequestUploadUrlInput, RequestUploadUrlResult } from '@/modules/storage/types/storage';

export interface StorageRepository {
  requestUploadUrl(input: RequestUploadUrlInput): Promise<RequestUploadUrlResult>;
}
