import { z } from 'zod';

import { validateSplitValues } from '@/modules/expense/schemas/validate-split-values';

export const updateExpenseSchema = z
  .object({
    expenseId: z.string().min(1),
    title: z.string().trim().min(1).max(120),
    amount: z.coerce.number().int().positive(),
    categoryId: z.string().optional().or(z.literal('')),
    paidByMemberId: z.string().min(1),
    participantMemberIds: z.array(z.string().min(1)).min(1),
    splitMethod: z.enum(['equal', 'exact', 'percentage', 'shares']),
    splitValues: z.record(z.string(), z.coerce.number()).optional(),
    merchantName: z.string().trim().max(120).optional().or(z.literal('')),
    locationName: z.string().trim().max(120).optional().or(z.literal('')),
    note: z.string().trim().max(500).optional().or(z.literal('')),
    spentAt: z.string().optional().or(z.literal('')),
  })
  .superRefine(validateSplitValues);

export type UpdateExpenseSchema = z.infer<typeof updateExpenseSchema>;
