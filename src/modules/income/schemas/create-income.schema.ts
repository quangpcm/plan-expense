import { z } from 'zod';

export const createIncomeSchema = z.object({
  title: z.string().trim().min(1).max(120),
  amount: z.coerce.number().int().positive(),
  milestoneId: z.string().min(1),
  categoryId: z.string().optional().or(z.literal('')),
  contributedByMemberId: z.string().min(1),
  note: z.string().trim().max(500).optional().or(z.literal('')),
  receivedAt: z.string().optional().or(z.literal('')),
});

export type CreateIncomeSchema = z.infer<typeof createIncomeSchema>;
