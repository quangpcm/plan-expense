import { z } from 'zod';

export const addTodoVendorSchema = z.object({
  todoId: z.string().min(1),
  name: z.string().trim().min(1).max(160),
  link: z.string().trim().max(300).optional().or(z.literal('')),
  price: z.coerce.number().int().min(0),
});

export type AddTodoVendorSchema = z.infer<typeof addTodoVendorSchema>;
