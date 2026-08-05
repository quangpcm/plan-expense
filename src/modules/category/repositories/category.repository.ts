import type { CategoryDocument } from '@/modules/category/types/category';

export interface CategoryRepository {
  watchExpenseCategories(planId: string, callback: (categories: CategoryDocument[]) => void): () => void;
}

