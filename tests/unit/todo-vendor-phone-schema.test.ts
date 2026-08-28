import { describe, expect, it } from 'vitest';

import { addTodoVendorSchema } from '@/modules/todo/schemas/add-todo-vendor.schema';
import { updateTodoVendorSchema } from '@/modules/todo/schemas/update-todo-vendor.schema';

const baseAddInput = {
  todoId: 'todo-1',
  name: 'Studio ABC',
  price: 1_000_000,
  attachments: [],
};

const baseUpdateInput = {
  todoId: 'todo-1',
  vendorId: 'vendor-1',
  name: 'Studio ABC',
  price: 1_000_000,
  attachments: [],
};

describe('addTodoVendorSchema phoneNumber', () => {
  it('accepts a formatted local phone number', () => {
    const result = addTodoVendorSchema.parse({ ...baseAddInput, phoneNumber: '0905 123 456' });

    expect(result.phoneNumber).toBe('0905 123 456');
  });

  it('accepts a formatted international phone number', () => {
    const result = addTodoVendorSchema.parse({ ...baseAddInput, phoneNumber: '+84 905 123 456' });

    expect(result.phoneNumber).toBe('+84 905 123 456');
  });

  it('accepts a missing phoneNumber (legacy vendor without the field)', () => {
    const result = addTodoVendorSchema.parse({ ...baseAddInput });

    expect(result.phoneNumber).toBeUndefined();
  });

  it('accepts an empty string phoneNumber', () => {
    const result = addTodoVendorSchema.parse({ ...baseAddInput, phoneNumber: '' });

    expect(result.phoneNumber).toBe('');
  });

  it('trims whitespace', () => {
    const result = addTodoVendorSchema.parse({ ...baseAddInput, phoneNumber: '  0905 123 456  ' });

    expect(result.phoneNumber).toBe('0905 123 456');
  });

  it('rejects letters', () => {
    expect(() => addTodoVendorSchema.parse({ ...baseAddInput, phoneNumber: 'abc-123' })).toThrow();
  });

  it('rejects a value over the max length', () => {
    expect(() => addTodoVendorSchema.parse({ ...baseAddInput, phoneNumber: '0'.repeat(31) })).toThrow();
  });
});

describe('updateTodoVendorSchema phoneNumber', () => {
  it('accepts and preserves formatted phone numbers', () => {
    const result = updateTodoVendorSchema.parse({ ...baseUpdateInput, phoneNumber: '0905-123-456' });

    expect(result.phoneNumber).toBe('0905-123-456');
  });

  it('rejects a non-string, non-phone-safe value', () => {
    expect(() => updateTodoVendorSchema.parse({ ...baseUpdateInput, phoneNumber: 'call me!' })).toThrow();
  });
});
