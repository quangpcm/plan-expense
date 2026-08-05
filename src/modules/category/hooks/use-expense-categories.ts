'use client';

import { useEffect, useState } from 'react';

import { categoryService } from '@/modules/category/services';
import type { CategoryDocument } from '@/modules/category/types/category';

export function useExpenseCategories(planId: string) {
  const [categories, setCategories] = useState<CategoryDocument[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) {
      return undefined;
    }

    return categoryService.watchExpenseCategories(
      planId,
      (items) => {
        setCategories(items);
        setErrorMessage(null);
      },
      (error) => {
        setCategories([]);
        setErrorMessage(error.message);
      },
    );
  }, [planId]);

  return {
    categories,
    errorMessage,
  };
}
