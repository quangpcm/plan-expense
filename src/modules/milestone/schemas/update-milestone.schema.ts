import { z } from 'zod';

export const updateMilestoneSchema = z
  .object({
    milestoneId: z.string().min(1),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional().or(z.literal('')),
    iconId: z.string().trim().max(120).optional().or(z.literal('')),
    startDate: z.string().optional().or(z.literal('')),
    endDate: z.string().optional().or(z.literal('')),
    status: z.enum(['upcoming', 'in_progress', 'completed', 'cancelled']),
    budgetAmount: z.coerce.number().int().nonnegative().optional(),
  })
  .refine(
    (value) => {
      if (!value.startDate || !value.endDate) {
        return true;
      }

      return new Date(value.startDate).getTime() <= new Date(value.endDate).getTime();
    },
    {
      path: ['endDate'],
      message: 'End date must be on or after the start date.',
    },
  );

export type UpdateMilestoneSchema = z.infer<typeof updateMilestoneSchema>;
