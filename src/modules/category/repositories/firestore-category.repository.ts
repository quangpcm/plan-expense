'use client';

import { collection, onSnapshot } from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import type { CategoryRepository } from '@/modules/category/repositories/category.repository';
import type { CategoryDocument } from '@/modules/category/types/category';

export class FirestoreCategoryRepository implements CategoryRepository {
  watchExpenseCategories(planId: string, callback: (categories: CategoryDocument[]) => void) {
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
      },
    );
  }
}
