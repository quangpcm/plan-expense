import { getEnv } from '@/config/env';
import type { MediaAttachment } from '@/modules/storage/types/attachment';

export function getMediaPublicUrl(storagePath: string): string {
  const baseUrl = getEnv().NEXT_PUBLIC_R2_PUBLIC_BASE_URL ?? '';

  return `${baseUrl.replace(/\/$/, '')}/${storagePath}`;
}

export function resolveAttachmentUrl(attachment: Pick<MediaAttachment, 'storagePath' | 'externalUrl'>): string {
  if (attachment.externalUrl) {
    return attachment.externalUrl;
  }

  return attachment.storagePath ? getMediaPublicUrl(attachment.storagePath) : '';
}
