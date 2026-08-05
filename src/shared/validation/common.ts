import { z } from 'zod';

export const requiredStringSchema = z.string().trim().min(1);

export const optionalNullableStringSchema = z.string().trim().nullable().optional();

export const positiveMoneySchema = z.number().int().positive();

