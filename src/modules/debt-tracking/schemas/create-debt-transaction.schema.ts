import { z } from 'zod';

import {
  debtTransactionCategoryValues,
  loanCategoryOptions,
  repaymentCategoryOptions,
} from '@/modules/debt-tracking/constants/debt-transaction-category';
import { attachmentDraftSchema } from '@/modules/storage/schemas/attachment-draft.schema';

const loanCategoryValues = loanCategoryOptions.map((option) => option.value);
const repaymentCategoryValues = repaymentCategoryOptions.map((option) => option.value);

export const createDebtTransactionSchema = z
  .object({
    counterpartyMemberId: z.string().trim().min(1, 'Vui lòng chọn người.'),
    direction: z.enum(['receivable', 'payable']),
    type: z.enum(['loan', 'repayment']),
    title: z.string().trim().min(1, 'Vui lòng nhập tên giao dịch.').max(120),
    category: z.enum(debtTransactionCategoryValues),
    amount: z.coerce.number().int().positive('Số tiền phải lớn hơn 0.'),
    occurredAt: z.string().min(1, 'Vui lòng chọn ngày.'),
    dueDate: z.string().optional().or(z.literal('')),
    note: z.string().trim().max(500).optional().or(z.literal('')),
    attachments: z.array(attachmentDraftSchema).max(5),
  })
  .refine(
    (value) =>
      value.type === 'loan'
        ? (loanCategoryValues as string[]).includes(value.category)
        : (repaymentCategoryValues as string[]).includes(value.category),
    { message: 'Danh mục không hợp lệ với loại giao dịch này.', path: ['category'] },
  );

export type CreateDebtTransactionSchema = z.infer<typeof createDebtTransactionSchema>;
