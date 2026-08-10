import type { CategoryDocument } from '@/modules/category/types/category';

export interface CategoryRepository {
  watchExpenseCategories(
    planId: string,
    callback: (categories: CategoryDocument[]) => void,
    onError?: (error: Error) => void,
  ): () => void;
  watchIncomeCategories(
    planId: string,
    callback: (categories: CategoryDocument[]) => void,
    onError?: (error: Error) => void,
  ): () => void;
}
