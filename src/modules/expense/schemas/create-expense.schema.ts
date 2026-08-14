import { z } from 'zod';

import { validateSplitValues } from '@/modules/expense/schemas/validate-split-values';
import { attachmentDraftSchema } from '@/modules/storage/schemas/attachment-draft.schema';

export const createExpenseSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    amount: z.coerce.number().int().positive(),
    milestoneId: z.string().min(1),
    categoryId: z.string().optional().or(z.literal('')),
    paidByMemberId: z.string().min(1),
    participantMemberIds: z.array(z.string().min(1)).min(1),
    splitMethod: z.enum(['self', 'equal', 'exact', 'percentage', 'shares']),
    splitValues: z.record(z.string(), z.coerce.number()).optional(),
    merchantName: z.string().trim().max(120).optional().or(z.literal('')),
    locationName: z.string().trim().max(120).optional().or(z.literal('')),
    note: z.string().trim().max(500).optional().or(z.literal('')),
    spentAt: z.string().optional().or(z.literal('')),
    attachments: z.array(attachmentDraftSchema).max(5),
  })
  .superRefine(validateSplitValues);

export type CreateExpenseSchema = z.infer<typeof createExpenseSchema>;
