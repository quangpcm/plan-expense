import { z } from 'zod';

export const updateDisplayNameSchema = z.object({
  displayName: z.string().trim().min(2).max(60),
});

export type UpdateDisplayNameSchema = z.infer<typeof updateDisplayNameSchema>;
