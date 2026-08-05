import { z } from 'zod';

export const addGuestSchema = z.object({
  nickname: z.string().trim().min(2).max(60),
  role: z.enum(['editor', 'viewer']),
});

export type AddGuestSchema = z.infer<typeof addGuestSchema>;

