import { z } from 'zod';

export const updateIncomeSchema = z.object({
  incomeId: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  amount: z.coerce.number().int().positive(),
  milestoneId: z.string().min(1),
  categoryId: z.string().optional().or(z.literal('')),
  contributedByMemberId: z.string().min(1),
  allocatedToMemberId: z.string().min(1).nullable(),
  note: z.string().trim().max(500).optional().or(z.literal('')),
  receivedAt: z.string().optional().or(z.literal('')),
});

export type UpdateIncomeSchema = z.infer<typeof updateIncomeSchema>;
