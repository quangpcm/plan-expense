import type { MediaAttachment } from '@/modules/storage/types/attachment';
import { storageRepository } from '@/modules/storage/services';

export function collectStoragePaths(...attachmentLists: MediaAttachment[][]): string[] {
  return attachmentLists
    .flat()
    .map((attachment) => attachment.storagePath)
    .filter((path): path is string => Boolean(path));
}

export function deleteAttachmentsInBackground(planId: string, ...attachmentLists: MediaAttachment[][]): void {
  const storagePaths = collectStoragePaths(...attachmentLists);

  if (storagePaths.length === 0) {
    return;
  }

  void storageRepository.deleteAttachments({ planId, storagePaths }).catch((error) => {
    console.error('Không thể xoá media khỏi storage:', error);
  });
}
