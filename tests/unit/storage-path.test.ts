import { describe, expect, it } from 'vitest';

import { buildStoragePath, resolveFileExtension } from '@/modules/storage/utils/storage-path';
import type { RequestUploadUrlInput } from '@/modules/storage/types/storage';

describe('resolveFileExtension', () => {
  it('extracts the extension from the file name, lowercased', () => {
    expect(resolveFileExtension('Receipt.JPG', 'image/jpeg')).toBe('jpg');
  });

  it('falls back to the mime type when the file name has no extension', () => {
    expect(resolveFileExtension('receipt', 'image/png')).toBe('png');
  });

  it('falls back to bin when neither the file name nor mime type is recognized', () => {
    expect(resolveFileExtension('receipt', 'application/octet-stream')).toBe('bin');
  });
});

describe('buildStoragePath', () => {
  const base = { fileName: 'receipt.png', contentType: 'image/png', size: 1024 };

  it('builds the avatar path', () => {
    const input: RequestUploadUrlInput = { ...base, mediaType: 'avatar', userId: 'user1' };
    expect(buildStoragePath(input, 'file1')).toBe('users/user1/avatar/file1.png');
  });

  it('builds the plan cover path', () => {
    const input: RequestUploadUrlInput = { ...base, mediaType: 'plan-cover', planId: 'plan1' };
    expect(buildStoragePath(input, 'file1')).toBe('plans/plan1/cover/file1.png');
  });

  it('builds the expense attachment path', () => {
    const input: RequestUploadUrlInput = {
      ...base,
      mediaType: 'expense-attachment',
      planId: 'plan1',
      expenseId: 'expense1',
    };
    expect(buildStoragePath(input, 'file1')).toBe('plans/plan1/expenses/expense1/file1.png');
  });

  it('builds the income attachment path', () => {
    const input: RequestUploadUrlInput = {
      ...base,
      mediaType: 'income-attachment',
      planId: 'plan1',
      incomeId: 'income1',
    };
    expect(buildStoragePath(input, 'file1')).toBe('plans/plan1/incomes/income1/file1.png');
  });

  it('builds the settlement attachment path', () => {
    const input: RequestUploadUrlInput = {
      ...base,
      mediaType: 'settlement-attachment',
      planId: 'plan1',
      settlementId: 'settlement1',
    };
    expect(buildStoragePath(input, 'file1')).toBe('plans/plan1/settlements/settlement1/file1.png');
  });

  it('builds the todo attachment path', () => {
    const input: RequestUploadUrlInput = {
      ...base,
      mediaType: 'todo-attachment',
      planId: 'plan1',
      todoId: 'todo1',
    };
    expect(buildStoragePath(input, 'file1')).toBe('plans/plan1/todos/todo1/file1.png');
  });

  it('builds the todo vendor attachment path', () => {
    const input: RequestUploadUrlInput = {
      ...base,
      mediaType: 'todo-vendor-attachment',
      planId: 'plan1',
      todoId: 'todo1',
      vendorId: 'vendor1',
    };
    expect(buildStoragePath(input, 'file1')).toBe('plans/plan1/todos/todo1/vendors/vendor1/file1.png');
  });
});
