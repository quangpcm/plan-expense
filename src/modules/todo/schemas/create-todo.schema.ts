import { z } from 'zod';

export const createTodoSchema = z.object({
  milestoneId: z.string().min(1),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  assigneeMemberId: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high']),
});

export type CreateTodoSchema = z.infer<typeof createTodoSchema>;
