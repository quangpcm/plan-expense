'use client';

import { FirestoreIncomeRepository } from '@/modules/income/repositories/firestore-income.repository';
import { IncomeService } from '@/modules/income/services/income.service';

const incomeRepository = new FirestoreIncomeRepository();

export const incomeService = new IncomeService(incomeRepository);

