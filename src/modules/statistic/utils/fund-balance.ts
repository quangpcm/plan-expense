import type { ExpenseDocument } from '@/modules/expense/types/expense';
import type { IncomeDocument } from '@/modules/income/types/income';

export function resolveIncomeAllocation(
  income: Pick<IncomeDocument, 'allocatedToMemberId'>,
  ownerMemberId: string,
): string | null {
  if (income.allocatedToMemberId === undefined) {
    return ownerMemberId;
  }

  return income.allocatedToMemberId;
}

export type FundBalanceInput = {
  incomes: Pick<IncomeDocument, 'amount' | 'status' | 'allocatedToMemberId'>[];
  expenses: Pick<ExpenseDocument, 'amount' | 'status' | 'paymentSourceType'>[];
  ownerMemberId: string;
};

export type FundBalanceBreakdown = {
  totalIncome: number;
  totalAllocatedIncome: number;
  totalUnallocatedIncome: number;
  totalExpensePaidFromFund: number;
  unallocatedBalance: number;
};

export function calculateFundBalance(input: FundBalanceInput): FundBalanceBreakdown {
  const activeIncomes = input.incomes.filter((income) => income.status === 'active');

  const totalIncome = activeIncomes.reduce((sum, income) => sum + income.amount, 0);

  const totalAllocatedIncome = activeIncomes
    .filter((income) => resolveIncomeAllocation(income, input.ownerMemberId) !== null)
    .reduce((sum, income) => sum + income.amount, 0);

  const totalUnallocatedIncome = totalIncome - totalAllocatedIncome;

  const totalExpensePaidFromFund = input.expenses
    .filter((expense) => expense.status === 'active' && expense.paymentSourceType === 'fund')
    .reduce((sum, expense) => sum + expense.amount, 0);

  return {
    totalIncome,
    totalAllocatedIncome,
    totalUnallocatedIncome,
    totalExpensePaidFromFund,
    unallocatedBalance: totalUnallocatedIncome - totalExpensePaidFromFund,
  };
}
