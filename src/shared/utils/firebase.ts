import type { Timestamp } from 'firebase/firestore';

export function timestampToDate(timestamp: Timestamp | Date) {
  return timestamp instanceof Date ? timestamp : timestamp.toDate();
}

