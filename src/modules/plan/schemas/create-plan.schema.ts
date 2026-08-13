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
    budgetAmount: z.coerce.number().int().nonnegative().optional(),
    savingGoalAmount: z.coerce.number().int().nonnegative().optional(),
    savingTargetDate: z.string().optional().or(z.literal('')),
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
  )
  .refine(
    (value) => {
      if (!['travel', 'wedding', 'birthday', 'event'].includes(value.planType)) {
        return true;
      }

      return value.budgetAmount === undefined || value.budgetAmount > 0;
    },
    {
      path: ['budgetAmount'],
      message: 'Plan này nên có ngân sách lớn hơn 0.',
    },
  )
  .refine(
    (value) => {
      if (value.planType !== 'saving') {
        return true;
      }

      return value.savingGoalAmount === undefined || value.savingGoalAmount > 0;
    },
    {
      path: ['savingGoalAmount'],
      message: 'Saving plan nên có mục tiêu tích lũy lớn hơn 0.',
    },
  );

export type CreatePlanSchema = z.infer<typeof createPlanSchema>;
