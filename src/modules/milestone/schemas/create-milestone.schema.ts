import { z } from 'zod';

export const createMilestoneSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional().or(z.literal('')),
    iconId: z.string().trim().max(120).optional().or(z.literal('')),
    startDate: z.string().optional().or(z.literal('')),
    endDate: z.string().optional().or(z.literal('')),
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

export type CreateMilestoneSchema = z.infer<typeof createMilestoneSchema>;
