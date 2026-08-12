'use client';

import { Timestamp } from 'firebase/firestore';

import type { ExpenseAttachment } from '@/modules/expense/types/expense';
import { storageRepository } from '@/modules/storage/services';
import { AppError } from '@/shared/errors/app-error';

async function readImageSize(file: File) {
  return new Promise<{ width: number | null; height: number | null }>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      resolve({ width: image.width, height: image.height });
      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      resolve({ width: null, height: null });
      URL.revokeObjectURL(objectUrl);
    };

    image.src = objectUrl;
  });
}

export async function uploadExpenseAttachments(
  planId: string,
  expenseId: string,
  files: File[],
) {
  if (files.length === 0) {
    return [];
  }

  const attachments: ExpenseAttachment[] = [];

  for (const file of files) {
    const { storagePath, uploadUrl } = await storageRepository.requestUploadUrl({
      mediaType: 'expense-attachment',
      planId,
      expenseId,
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
        'EXPENSE_ATTACHMENT_UPLOAD_FAILED',
        500,
      );
    });

    if (!uploadResponse.ok) {
      throw new AppError(
        'Attachment upload failed. Please verify the R2 bucket and credentials are configured correctly.',
        'EXPENSE_ATTACHMENT_UPLOAD_FAILED',
        500,
      );
    }

    const dimensions = file.type.startsWith('image/')
      ? await readImageSize(file)
      : { width: null, height: null };

    attachments.push({
      id: crypto.randomUUID(),
      fileName: file.name,
      storagePath,
      mimeType: file.type,
      size: file.size,
      width: dimensions.width,
      height: dimensions.height,
      createdAt: Timestamp.now(),
    });
  }

  return attachments;
}
