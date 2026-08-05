'use client';

import { FirestoreCategoryRepository } from '@/modules/category/repositories/firestore-category.repository';
import { CategoryService } from '@/modules/category/services/category.service';

const categoryRepository = new FirestoreCategoryRepository();

export const categoryService = new CategoryService(categoryRepository);

