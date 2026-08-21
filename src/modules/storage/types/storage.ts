export type MediaType =
  | 'avatar'
  | 'plan-cover'
  | 'expense-attachment'
  | 'income-attachment'
  | 'settlement-attachment'
  | 'todo-attachment'
  | 'todo-vendor-attachment'
  | 'debt-transaction-attachment'
  | 'travel-activity-attachment';

type BaseUploadInput = {
  fileName: string;
  contentType: string;
  size: number;
};

export type RequestUploadUrlInput =
  | (BaseUploadInput & { mediaType: 'avatar'; userId: string })
  | (BaseUploadInput & { mediaType: 'plan-cover'; planId: string })
  | (BaseUploadInput & { mediaType: 'expense-attachment'; planId: string; expenseId: string })
  | (BaseUploadInput & { mediaType: 'income-attachment'; planId: string; incomeId: string })
  | (BaseUploadInput & { mediaType: 'settlement-attachment'; planId: string; settlementId: string })
  | (BaseUploadInput & { mediaType: 'todo-attachment'; planId: string; todoId: string })
  | (BaseUploadInput & { mediaType: 'todo-vendor-attachment'; planId: string; todoId: string; vendorId: string })
  | (BaseUploadInput & { mediaType: 'debt-transaction-attachment'; planId: string; transactionId: string })
  | (BaseUploadInput & { mediaType: 'travel-activity-attachment'; planId: string; activityId: string });

export type RequestUploadUrlResult = {
  storagePath: string;
  uploadUrl: string;
  publicUrl: string;
};
