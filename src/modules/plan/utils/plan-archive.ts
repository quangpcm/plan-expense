import type { Timestamp } from 'firebase/firestore';

import { PLAN_ARCHIVE_RETENTION_DAYS } from '@/modules/plan/constants/plan.constants';

const RETENTION_MS = PLAN_ARCHIVE_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export function getArchiveDaysRemaining(archivedAt: Timestamp | null | undefined) {
  if (!archivedAt) {
    return null;
  }

  const remainingMs = archivedAt.toMillis() + RETENTION_MS - Date.now();

  return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
}

export function isArchiveExpired(archivedAt: Timestamp | null | undefined) {
  if (!archivedAt) {
    return false;
  }

  return archivedAt.toMillis() + RETENTION_MS <= Date.now();
}
