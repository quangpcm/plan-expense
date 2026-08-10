'use client';

import { collection, onSnapshot } from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import type { CategoryRepository } from '@/modules/category/repositories/category.repository';
import type { CategoryDocument } from '@/modules/category/types/category';
import { mapFirebaseError } from '@/shared/utils/firebase-error';

export class FirestoreCategoryRepository implements CategoryRepository {
  watchExpenseCategories(
    planId: string,
    callback: (categories: CategoryDocument[]) => void,
    onError?: (error: Error) => void,
  ) {
    return onSnapshot(
      collection(getFirebaseFirestore(), 'plans', planId, 'categories'),
      (snapshot) => {
        const categories = snapshot.docs
          .map((item) => item.data() as CategoryDocument)
          .filter((category) => category.categoryType === 'expense' && category.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder);

        callback(categories);
      },
      (error) => {
        console.error('watchExpenseCategories failed', error);
        callback([]);
        onError?.(mapFirebaseError(error, 'Unable to load categories for this plan.', 'CATEGORY_WATCH_FAILED'));
      },
    );
  }

  watchIncomeCategories(
    planId: string,
    callback: (categories: CategoryDocument[]) => void,
    onError?: (error: Error) => void,
  ) {
    return onSnapshot(
      collection(getFirebaseFirestore(), 'plans', planId, 'categories'),
      (snapshot) => {
        const categories = snapshot.docs
          .map((item) => item.data() as CategoryDocument)
          .filter((category) => category.categoryType === 'income' && category.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder);

        callback(categories);
      },
      (error) => {
        console.error('watchIncomeCategories failed', error);
        callback([]);
        onError?.(mapFirebaseError(error, 'Unable to load categories for this plan.', 'CATEGORY_WATCH_FAILED'));
      },
    );
  }
}
