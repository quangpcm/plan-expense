'use client';

import { Timestamp } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';

import { getFirebaseStorage } from '@/config/firebase.config';
import type { ExpenseAttachment } from '@/modules/expense/types/expense';

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
  const attachments: ExpenseAttachment[] = [];

  for (const file of files) {
    const attachmentId = crypto.randomUUID();
    const storagePath = `plans/${planId}/expenses/${expenseId}/${attachmentId}-${file.name}`;
    const storageRef = ref(getFirebaseStorage(), storagePath);
    await uploadBytes(storageRef, file, {
      contentType: file.type,
    });

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
