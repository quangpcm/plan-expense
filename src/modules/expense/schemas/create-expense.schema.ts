import { z } from 'zod';

export const createExpenseSchema = z.object({
  title: z.string().trim().min(1).max(120),
  amount: z.coerce.number().int().positive(),
  categoryId: z.string().optional().or(z.literal('')),
  paidByMemberId: z.string().min(1),
  participantMemberIds: z.array(z.string().min(1)).min(1),
  splitMethod: z.literal('equal'),
  merchantName: z.string().trim().max(120).optional().or(z.literal('')),
  locationName: z.string().trim().max(120).optional().or(z.literal('')),
  note: z.string().trim().max(500).optional().or(z.literal('')),
  spentAt: z.string().optional().or(z.literal('')),
  attachments: z.array(z.instanceof(File)).max(5),
});

export type CreateExpenseSchema = z.infer<typeof createExpenseSchema>;

