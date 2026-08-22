import { z } from 'zod';

const moduleAccessLevelSchema = z.enum(['hidden', 'view', 'manage_own', 'manage_all']);

export const updateMemberSchema = z.object({
  memberId: z.string().min(1),
  nickname: z.string().trim().min(2).max(60),
  role: z.enum(['editor', 'viewer']),
  moduleAccess: z.record(z.string(), moduleAccessLevelSchema),
});

export type UpdateMemberSchema = z.infer<typeof updateMemberSchema>;
