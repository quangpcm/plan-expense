import { z } from 'zod';

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(2).max(60),
    email: z.email().trim(),
    password: z.string().min(6).max(100),
    confirmPassword: z.string().min(6).max(100),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export type RegisterSchema = z.infer<typeof registerSchema>;

