export type MediaType = 'avatar' | 'plan-cover' | 'expense-attachment' | 'income-attachment' | 'settlement-attachment';

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
  | (BaseUploadInput & { mediaType: 'settlement-attachment'; planId: string; settlementId: string });

export type RequestUploadUrlResult = {
  storagePath: string;
  uploadUrl: string;
  publicUrl: string;
};
