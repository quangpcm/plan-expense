import type { MediaAttachment } from '@/modules/storage/types/attachment';

export function diffRemovedAttachments(previous: MediaAttachment[], next: MediaAttachment[]): MediaAttachment[] {
  const nextIds = new Set(next.map((attachment) => attachment.id));

  return previous.filter((attachment) => !nextIds.has(attachment.id));
}
