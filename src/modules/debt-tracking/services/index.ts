'use client';

import { FirestoreDebtTransactionRepository } from '@/modules/debt-tracking/repositories/firestore-debt-transaction.repository';
import { DebtTransactionService } from '@/modules/debt-tracking/services/debt-transaction.service';

const debtTransactionRepository = new FirestoreDebtTransactionRepository();

export const debtTransactionService = new DebtTransactionService(debtTransactionRepository);
