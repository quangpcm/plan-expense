import { z } from 'zod';

import { validatePaymentSource } from '@/modules/expense/schemas/validate-payment-source';
import { validateSplitValues } from '@/modules/expense/schemas/validate-split-values';
import { attachmentDraftSchema } from '@/modules/storage/schemas/attachment-draft.schema';

export const updateExpenseSchema = z
  .object({
    expenseId: z.string().min(1),
    title: z.string().trim().min(1).max(120),
    amount: z.coerce.number().int().positive(),
    milestoneId: z.string().min(1),
    activityId: z.string().optional().or(z.literal('')),
    categoryId: z.string().optional().or(z.literal('')),
    paymentSourceType: z.enum(['member', 'fund']).default('member'),
    paidByMemberId: z.string().optional().or(z.literal('')),
    participantMemberIds: z.array(z.string().min(1)).min(1),
    splitMethod: z.enum(['self', 'equal', 'exact', 'percentage', 'shares']),
    splitValues: z.record(z.string(), z.coerce.number()).optional(),
    merchantName: z.string().trim().max(120).optional().or(z.literal('')),
    locationName: z.string().trim().max(120).optional().or(z.literal('')),
    note: z.string().trim().max(500).optional().or(z.literal('')),
    spentAt: z.string().optional().or(z.literal('')),
    attachments: z.array(attachmentDraftSchema).max(5),
  })
  .superRefine(validateSplitValues)
  .superRefine(validatePaymentSource);

export type UpdateExpenseSchema = z.infer<typeof updateExpenseSchema>;
