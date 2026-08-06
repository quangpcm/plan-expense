import { z } from 'zod';

export const updateMemberSchema = z.object({
  memberId: z.string().min(1),
  nickname: z.string().trim().min(2).max(60),
  role: z.enum(['editor', 'viewer']),
  canEditAllExpenses: z.boolean(),
});

export type UpdateMemberSchema = z.infer<typeof updateMemberSchema>;
