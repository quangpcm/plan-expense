'use client';

import { FirestoreExpenseRepository } from '@/modules/expense/repositories/firestore-expense.repository';
import { ExpenseService } from '@/modules/expense/services/expense.service';

const expenseRepository = new FirestoreExpenseRepository();

export const expenseService = new ExpenseService(expenseRepository);

