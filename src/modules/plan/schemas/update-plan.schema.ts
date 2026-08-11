import { z } from 'zod';

export const updatePlanSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1000).optional().or(z.literal('')),
    startDate: z.string().optional().or(z.literal('')),
    endDate: z.string().optional().or(z.literal('')),
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

export type UpdatePlanSchema = z.infer<typeof updatePlanSchema>;
