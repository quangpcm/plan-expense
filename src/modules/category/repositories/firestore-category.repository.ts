'use client';

import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';

import { getFirebaseFirestore } from '@/config/firebase.config';
import type { CategoryRepository } from '@/modules/category/repositories/category.repository';
import type { CategoryDocument } from '@/modules/category/types/category';

export class FirestoreCategoryRepository implements CategoryRepository {
  watchExpenseCategories(planId: string, callback: (categories: CategoryDocument[]) => void) {
    const categoriesQuery = query(
      collection(getFirebaseFirestore(), 'plans', planId, 'categories'),
      where('categoryType', '==', 'expense'),
      where('isActive', '==', true),
      orderBy('sortOrder', 'asc'),
    );

    return onSnapshot(categoriesQuery, (snapshot) => {
      callback(snapshot.docs.map((item) => item.data() as CategoryDocument));
    });
  }
}

