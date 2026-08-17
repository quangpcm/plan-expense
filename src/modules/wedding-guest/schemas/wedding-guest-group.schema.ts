import { z } from 'zod';

export const weddingGuestGroupSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export type WeddingGuestGroupSchema = z.infer<typeof weddingGuestGroupSchema>;
