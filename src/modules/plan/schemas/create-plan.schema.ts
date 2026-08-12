import { z } from 'zod';

export const createPlanSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(300).optional().or(z.literal('')),
    planType: z.enum([
      'travel',
      'wedding',
      'saving',
      'birthday',
      'event',
      'shared_living',
      'project',
      'general',
    ]),
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

export type CreatePlanSchema = z.infer<typeof createPlanSchema>;

