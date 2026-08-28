import { z } from 'zod';

import { attachmentDraftSchema } from '@/modules/storage/schemas/attachment-draft.schema';
import { phoneNumberSchema } from '@/modules/todo/schemas/todo-vendor-phone.schema';

export const updateTodoVendorSchema = z.object({
  todoId: z.string().min(1),
  vendorId: z.string().min(1),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(280).optional().or(z.literal('')),
  link: z.string().trim().max(300).optional().or(z.literal('')),
  phoneNumber: phoneNumberSchema,
  price: z.coerce.number().int().min(0),
  attachments: z.array(attachmentDraftSchema).max(5),
});

export type UpdateTodoVendorSchema = z.infer<typeof updateTodoVendorSchema>;
