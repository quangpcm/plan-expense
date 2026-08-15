'use client';

import { getIdToken } from 'firebase/auth';

import { getFirebaseAuth } from '@/config/firebase.config';
import type { StorageRepository } from '@/modules/storage/repositories/storage.repository';
import type { RequestUploadUrlInput, RequestUploadUrlResult } from '@/modules/storage/types/storage';
import { AppError } from '@/shared/errors/app-error';

export class R2StorageRepository implements StorageRepository {
  async requestUploadUrl(input: RequestUploadUrlInput): Promise<RequestUploadUrlResult> {
    const currentUser = getFirebaseAuth().currentUser;

    if (!currentUser) {
      throw new AppError('You must be signed in to upload files.', 'STORAGE_NOT_AUTHENTICATED', 401);
    }

    const idToken = await getIdToken(currentUser);

    const response = await fetch('/api/storage/presign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(input),
    });

    const payload: { error?: { code?: string; message?: string } } & Partial<RequestUploadUrlResult> = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      throw new AppError(
        payload.error?.message ?? 'Failed to request an upload URL.',
        payload.error?.code ?? 'STORAGE_PRESIGN_FAILED',
        response.status,
      );
    }

    return payload as RequestUploadUrlResult;
  }

  async deleteAttachments(input: { planId: string; storagePaths: string[] }): Promise<void> {
    if (input.storagePaths.length === 0) {
      return;
    }

    const currentUser = getFirebaseAuth().currentUser;

    if (!currentUser) {
      throw new AppError('You must be signed in to delete files.', 'STORAGE_NOT_AUTHENTICATED', 401);
    }

    const idToken = await getIdToken(currentUser);

    const response = await fetch('/api/storage/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(input),
    });

    const payload: { error?: { code?: string; message?: string } } = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new AppError(
        payload.error?.message ?? 'Failed to delete storage objects.',
        payload.error?.code ?? 'STORAGE_DELETE_FAILED',
        response.status,
      );
    }
  }
}
