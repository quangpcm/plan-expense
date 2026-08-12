'use client';

import { Timestamp } from 'firebase/firestore';

import type { AttachmentDraft, AttachmentUploadContext, MediaAttachment } from '@/modules/storage/types/attachment';
import { readImageDimensions } from '@/modules/storage/utils/read-image-dimensions';
import { storageRepository } from '@/modules/storage/services';
import { AppError } from '@/shared/errors/app-error';

async function resolveFileDraft(context: AttachmentUploadContext, file: File): Promise<MediaAttachment> {
  const { storagePath, uploadUrl } = await storageRepository.requestUploadUrl({
    ...context,
    fileName: file.name,
    contentType: file.type,
    size: file.size,
  });

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  }).catch((error) => {
    throw new AppError(
      error instanceof Error ? error.message : 'Attachment upload failed.',
      'ATTACHMENT_UPLOAD_FAILED',
      500,
    );
  });

  if (!uploadResponse.ok) {
    throw new AppError(
      'Attachment upload failed. Please verify the R2 bucket and credentials are configured correctly.',
      'ATTACHMENT_UPLOAD_FAILED',
      500,
    );
  }

  const dimensions = file.type.startsWith('image/')
    ? await readImageDimensions(file)
    : { width: null, height: null };

  return {
    id: crypto.randomUUID(),
    fileName: file.name,
    storagePath,
    externalUrl: null,
    mimeType: file.type,
    size: file.size,
    width: dimensions.width,
    height: dimensions.height,
    createdAt: Timestamp.now(),
  };
}

async function resolveUrlDraft(url: string): Promise<MediaAttachment> {
  const dimensions = await readImageDimensions(url);
  const fileName = url.split('/').pop()?.split('?')[0] || 'image';

  return {
    id: crypto.randomUUID(),
    fileName,
    storagePath: null,
    externalUrl: url,
    mimeType: 'image/*',
    size: null,
    width: dimensions.width,
    height: dimensions.height,
    createdAt: Timestamp.now(),
  };
}

export async function resolveAttachmentDrafts(
  context: AttachmentUploadContext,
  drafts: AttachmentDraft[],
): Promise<MediaAttachment[]> {
  const resolved: MediaAttachment[] = [];

  for (const draft of drafts) {
    if (draft.kind === 'existing') {
      resolved.push(draft.attachment);
      continue;
    }

    if (draft.kind === 'url') {
      resolved.push(await resolveUrlDraft(draft.url));
      continue;
    }

    resolved.push(await resolveFileDraft(context, draft.file));
  }

  return resolved;
}
