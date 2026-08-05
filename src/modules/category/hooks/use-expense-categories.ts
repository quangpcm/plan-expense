'use client';

import { useEffect, useState } from 'react';

import { categoryService } from '@/modules/category/services';
import type { CategoryDocument } from '@/modules/category/types/category';

export function useExpenseCategories(planId: string) {
  const [categories, setCategories] = useState<CategoryDocument[]>([]);

  useEffect(() => {
    if (!planId) {
      return undefined;
    }

    return categoryService.watchExpenseCategories(planId, setCategories);
  }, [planId]);

  return {
    categories,
  };
}

