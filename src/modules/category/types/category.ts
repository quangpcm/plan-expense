import type { Timestamp } from 'firebase/firestore';

export type CategoryType = 'expense' | 'income';

export type CategoryDocument = {
  id: string;
  planId: string;
  name: string;
  icon: string | null;
  categoryType: CategoryType;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CategoryPreset = {
  name: string;
  categoryType: CategoryType;
  icon: string | null;
};

