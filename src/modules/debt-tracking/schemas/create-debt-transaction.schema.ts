import { z } from 'zod';

import { attachmentDraftSchema } from '@/modules/storage/schemas/attachment-draft.schema';

export const createDebtTransactionSchema = z.object({
  counterpartyMemberId: z.string().trim().min(1, 'Vui lòng chọn người.'),
  direction: z.enum(['receivable', 'payable']),
  type: z.enum(['loan', 'repayment']),
  amount: z.coerce.number().int().positive('Số tiền phải lớn hơn 0.'),
  occurredAt: z.string().min(1, 'Vui lòng chọn ngày.'),
  dueDate: z.string().optional().or(z.literal('')),
  note: z.string().trim().max(500).optional().or(z.literal('')),
  attachments: z.array(attachmentDraftSchema).max(5),
});

export type CreateDebtTransactionSchema = z.infer<typeof createDebtTransactionSchema>;
