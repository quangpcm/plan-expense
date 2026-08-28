import { z } from 'zod';

// Conservative on purpose: reject obviously invalid input (letters, emoji, absurd length) without
// rejecting legitimate international/formatted phone numbers. No country-specific telecom rules.
const PHONE_NUMBER_MAX_LENGTH = 30;
const PHONE_NUMBER_PATTERN = /^[0-9+\-().\s]*$/;

export const phoneNumberSchema = z
  .string()
  .trim()
  .max(PHONE_NUMBER_MAX_LENGTH, 'Số điện thoại tối đa 30 ký tự.')
  .regex(PHONE_NUMBER_PATTERN, 'Số điện thoại chỉ được chứa số và các ký tự +, -, (, ), khoảng trắng.')
  .optional()
  .or(z.literal(''));
