import type { Timestamp } from 'firebase/firestore';

export type MediaAttachment = {
  id: string;
  fileName: string;
  storagePath: string | null;
  externalUrl: string | null;
  mimeType: string;
  size: number | null;
  width: number | null;
  height: number | null;
  createdAt: Timestamp;
};

export type AttachmentDraft =
  | { kind: 'existing'; id: string; attachment: MediaAttachment }
  | { kind: 'file'; id: string; file: File }
  | { kind: 'url'; id: string; url: string };

export type AttachmentUploadContext =
  | { mediaType: 'expense-attachment'; planId: string; expenseId: string }
  | { mediaType: 'income-attachment'; planId: string; incomeId: string }
  | { mediaType: 'settlement-attachment'; planId: string; settlementId: string }
  | { mediaType: 'todo-attachment'; planId: string; todoId: string }
  | { mediaType: 'todo-vendor-attachment'; planId: string; todoId: string; vendorId: string }
  | { mediaType: 'debt-transaction-attachment'; planId: string; transactionId: string }
  | { mediaType: 'travel-activity-attachment'; planId: string; activityId: string };
