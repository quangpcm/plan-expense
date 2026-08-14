import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import type {
  CategoryStatisticRow,
  MemberBalanceRow,
  MilestoneMemberStatisticRow,
  MilestoneStatisticRow,
  StatisticInput,
  StatisticResult,
  TimelineStatisticRow,
} from '@/modules/statistic/types/statistic';

export class StatisticService {
  calculate(input: StatisticInput): StatisticResult {
    const activeAndRemovedMembers = input.members.filter((member) => member.status !== 'invited');
    const overview = {
      totalExpense: input.expenses.reduce((sum, expense) => sum + expense.amount, 0),
      totalIncome: input.incomes.reduce((sum, income) => sum + income.amount, 0),
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
      milestoneBreakdown: this.calculateMilestones(input),
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
        const settlementPaid = input.settlements
          .filter((settlement) => settlement.status === 'completed' && settlement.fromMemberId === member.id)
          .reduce((sum, settlement) => sum + settlement.amount, 0);
        const settlementReceived = input.settlements
          .filter((settlement) => settlement.status === 'completed' && settlement.toMemberId === member.id)
          .reduce((sum, settlement) => sum + settlement.amount, 0);
        const balance = paid + totalIncome - owed;

        return {
          memberId: member.id,
          nickname: member.nickname,
          avatarUrl: member.avatarUrl,
          paid,
          owed,
          balance,
          totalIncome,
          settlementPaid,
          settlementReceived,
          adjustedBalance: balance + settlementPaid - settlementReceived,
        };
      })
      .sort((a, b) => b.adjustedBalance - a.adjustedBalance);
  }

  calculateCategory(input: StatisticInput): CategoryStatisticRow[] {
    const totals = new Map<string | null, number>();

    input.expenses.forEach((expense) => {
      const categoryId = expense.categoryId ?? null;
      totals.set(categoryId, (totals.get(categoryId) || 0) + expense.amount);
    });

    return Array.from(totals.entries())
      .map(([categoryId, totalAmount]) => ({
        categoryId,
        categoryName:
          input.categories.find((category) => category.id === categoryId)?.name || 'Chưa phân loại',
        icon: input.categories.find((category) => category.id === categoryId)?.icon || null,
        iconColor: input.categories.find((category) => category.id === categoryId)?.iconColor || 'text-slate-600',
        iconBgColor: input.categories.find((category) => category.id === categoryId)?.iconBgColor || 'bg-slate-100',
        totalAmount,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  calculateMilestones(input: StatisticInput): MilestoneStatisticRow[] {
    return input.milestones
      .map((milestone) => {
        const milestoneExpenses = input.expenses.filter((expense) => expense.milestoneId === milestone.id);
        const totalAmount = milestoneExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const progress =
          milestone.todoCount > 0
            ? Math.round((milestone.completedTodoCount / milestone.todoCount) * 100)
            : 0;

        const memberTotals = new Map<string, number>();
        milestoneExpenses.forEach((expense) => {
          memberTotals.set(
            expense.paidByMemberId,
            (memberTotals.get(expense.paidByMemberId) || 0) + expense.amount,
          );
        });
        const memberBreakdown: MilestoneMemberStatisticRow[] = Array.from(memberTotals.entries())
          .map(([memberId, memberTotalAmount]) => ({
            memberId,
            nickname: input.members.find((member) => member.id === memberId)?.nickname || 'Không rõ',
            totalAmount: memberTotalAmount,
          }))
          .sort((a, b) => b.totalAmount - a.totalAmount);

        return {
          milestoneId: milestone.id,
          milestoneTitle: milestone.title,
          status: milestone.status,
          totalAmount,
          budgetAmount: milestone.budgetAmount,
          expenseCount: milestoneExpenses.length,
          todoCount: milestone.todoCount,
          completedTodoCount: milestone.completedTodoCount,
          progress,
          memberBreakdown,
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  calculateTimeline(input: StatisticInput): TimelineStatisticRow[] {
    const totals = new Map<string, number>();

    input.expenses.forEach((expense) => {
      const date = timestampToDate(expense.spentAt);
      const key = date ? formatDate(date) : 'Unknown';
      totals.set(key, (totals.get(key) || 0) + expense.amount);
    });

    return Array.from(totals.entries())
      .map(([date, totalAmount]) => ({
        date,
        totalAmount,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}
