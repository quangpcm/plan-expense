import type { CategoryRepository } from '@/modules/category/repositories/category.repository';
import type { CategoryDocument } from '@/modules/category/types/category';

export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  watchExpenseCategories(planId: string, callback: (categories: CategoryDocument[]) => void) {
    return this.categoryRepository.watchExpenseCategories(planId, callback);
  }
}

