import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import type {
  CategoryStatisticRow,
  MemberBalanceRow,
  StatisticInput,
  StatisticResult,
  TimelineStatisticRow,
} from '@/modules/statistic/types/statistic';

export class StatisticService {
  calculate(input: StatisticInput): StatisticResult {
    const activeAndRemovedMembers = input.members.filter((member) => member.status !== 'invited');
    const overview = {
      totalExpense: input.expenses.reduce((sum, expense) => sum + expense.amount, 0),
      memberCount: activeAndRemovedMembers.length,
      expenseCount: input.expenses.length,
      averageExpense:
        input.expenses.length > 0
          ? Math.round(
              input.expenses.reduce((sum, expense) => sum + expense.amount, 0) / input.expenses.length,
            )
          : 0,
    };

    return {
      overview,
      memberBalances: this.calculateMemberBalance(input),
      categoryBreakdown: this.calculateCategory(input),
      expenseTimeline: this.calculateTimeline(input),
    };
  }

  calculateMemberBalance(input: StatisticInput): MemberBalanceRow[] {
    return input.members
      .filter((member) => member.status !== 'invited')
      .map((member) => {
        const paid = input.expenses
          .filter((expense) => expense.paidByMemberId === member.id)
          .reduce((sum, expense) => sum + expense.amount, 0);
        const owed = input.expenses.reduce((sum, expense) => {
          const participant = expense.participants.find((item) => item.memberId === member.id);
          return sum + (participant?.amount || 0);
        }, 0);
        const totalIncome = input.incomes
          .filter((income) => income.contributedByMemberId === member.id)
          .reduce((sum, income) => sum + income.amount, 0);

        return {
          memberId: member.id,
          nickname: member.nickname,
          paid,
          owed,
          balance: paid - owed,
          totalIncome,
        };
      })
      .sort((a, b) => b.balance - a.balance);
  }

  calculateCategory(input: StatisticInput): CategoryStatisticRow[] {
    const totals = new Map<string | null, number>();

    input.expenses.forEach((expense) => {
      totals.set(expense.categoryId, (totals.get(expense.categoryId) || 0) + expense.amount);
    });

    return Array.from(totals.entries())
      .map(([categoryId, totalAmount]) => ({
        categoryId,
        categoryName:
          input.categories.find((category) => category.id === categoryId)?.name || 'No category',
        totalAmount,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  calculateTimeline(input: StatisticInput): TimelineStatisticRow[] {
    const totals = new Map<string, number>();

    input.expenses.forEach((expense) => {
      const date = timestampToDate(expense.spentAt);
      const key = date ? formatDate(date) : 'Unknown';
      totals.set(key, (totals.get(key) || 0) + expense.amount);
    });

    return Array.from(totals.entries()).map(([date, totalAmount]) => ({
      date,
      totalAmount,
    }));
  }
}

