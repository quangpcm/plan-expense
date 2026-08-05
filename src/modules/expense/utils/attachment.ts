'use client';

import { Timestamp } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';

import { getFirebaseStorage } from '@/config/firebase.config';
import type { ExpenseAttachment } from '@/modules/expense/types/expense';
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
    const attachmentId = crypto.randomUUID();
    const storagePath = `plans/${planId}/expenses/${expenseId}/${attachmentId}-${file.name}`;
    const storageRef = ref(getFirebaseStorage(), storagePath);
    try {
      await uploadBytes(storageRef, file, {
        contentType: file.type,
      });
    } catch (error) {
      console.error('uploadExpenseAttachments failed', error);

      if (error && typeof error === 'object' && 'code' in error) {
        const code = String(error.code);

        if (code === 'storage/unauthorized') {
          throw new AppError(
            'Firebase Storage rejected the upload. Please check Storage rules or App Check.',
            'EXPENSE_ATTACHMENT_UNAUTHORIZED',
            403,
          );
        }

        if (code === 'storage/unknown' || code === 'storage/retry-limit-exceeded') {
          throw new AppError(
            'Attachment upload failed. Please verify Firebase Storage is enabled and the storage bucket is configured correctly.',
            'EXPENSE_ATTACHMENT_UPLOAD_FAILED',
            500,
          );
        }
      }

      if (error instanceof Error) {
        throw new AppError(error.message, 'EXPENSE_ATTACHMENT_UPLOAD_FAILED', 500);
      }

      throw new AppError(
        'Attachment upload failed. Please verify Firebase Storage configuration.',
        'EXPENSE_ATTACHMENT_UPLOAD_FAILED',
        500,
      );
    }

    const dimensions = file.type.startsWith('image/')
      ? await readImageSize(file)
      : { width: null, height: null };

    attachments.push({
      id: attachmentId,
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
