import { z } from 'zod';

const optionalNonNegativeInt = z.preprocess(
  (value) => {
    if (
      value === '' ||
      value === null ||
      value === undefined ||
      (typeof value === 'number' && Number.isNaN(value))
    ) {
      return undefined;
    }

    return value;
  },
  z.coerce.number().int().nonnegative().optional(),
);

export const createPlanSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(300).optional().or(z.literal('')),
    planType: z.enum([
      'debt',
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
    budgetAmount: optionalNonNegativeInt,
    savingGoalAmount: optionalNonNegativeInt,
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
      message: 'Ngày kết thúc phải sau hoặc trùng ngày bắt đầu.',
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

      return value.savingGoalAmount !== undefined && value.savingGoalAmount > 0;
    },
    {
      path: ['savingGoalAmount'],
      message: 'Cần nhập số tiền mục tiêu.',
    },
  );

export type CreatePlanSchema = z.infer<typeof createPlanSchema>;
