import { z } from 'zod';

import { debtTransactionCategoryValues } from '@/modules/debt-tracking/constants/debt-transaction-category';
import { attachmentDraftSchema } from '@/modules/storage/schemas/attachment-draft.schema';

export const updateDebtTransactionSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập tên giao dịch.').max(120),
  category: z.enum(debtTransactionCategoryValues),
  amount: z.coerce.number().int().positive('Số tiền phải lớn hơn 0.'),
  occurredAt: z.string().min(1, 'Vui lòng chọn ngày.'),
  dueDate: z.string().optional().or(z.literal('')),
  note: z.string().trim().max(500).optional().or(z.literal('')),
  attachments: z.array(attachmentDraftSchema).max(5),
});

export type UpdateDebtTransactionSchema = z.infer<typeof updateDebtTransactionSchema>;
