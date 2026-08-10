import { z } from 'zod';

export const createInvitationSchema = z.object({
  email: z.email().trim().optional().or(z.literal('')),
  role: z.enum(['editor', 'viewer']),
});

export type CreateInvitationSchema = z.infer<typeof createInvitationSchema>;
