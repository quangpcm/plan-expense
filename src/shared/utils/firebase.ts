import type { Timestamp } from 'firebase/firestore';

export function timestampToDate(timestamp: Timestamp | Date | null | undefined) {
  if (!timestamp) {
    return null;
  }

  return timestamp instanceof Date ? timestamp : timestamp.toDate();
}
