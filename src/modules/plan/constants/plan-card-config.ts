import type { PlanType, PlanSummary } from '@/modules/plan/types/plan';
import type { PlanCardFooterItem, PlanCardMetric, PlanCardProgress } from '@/modules/plan/types/plan-card';
import { planTypeOptions } from '@/modules/plan/constants/plan.constants';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate, formatDueCountdown, formatRelativeTime } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type PlanCardConfigContext = {
  plan: PlanSummary;
};

export type PlanCardTypeConfig = {
  primaryMetric: (context: PlanCardConfigContext) => PlanCardMetric;
  secondaryMetric: (context: PlanCardConfigContext) => PlanCardMetric;
  progress?: (context: PlanCardConfigContext) => PlanCardProgress | null;
  footerLeft: (context: PlanCardConfigContext) => PlanCardFooterItem;
};

const planTypeLabels = Object.fromEntries(planTypeOptions.map((option) => [option.value, option.label])) as Record<PlanType, string>;

function getSafeNumber(value: number | null | undefined, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function getSafeCountLabel(value: number | null | undefined, noun: string) {
  return `${getSafeNumber(value)} ${noun}`;
}

function getSafeCurrency(value: number | null | undefined) {
  return formatCurrency(getSafeNumber(value));
}

function getSafeBalance(plan: PlanSummary) {
  return getSafeNumber(plan.totalIncome) - getSafeNumber(plan.totalExpense);
}

function getSafeRatioLabel(
  completedValue: number | null | undefined,
  totalValue: number | null | undefined,
  noun: string,
) {
  const completed = getSafeNumber(completedValue);
  const total = getSafeNumber(totalValue);
  return `${completed}/${total} ${noun}`;
}

function buildUpdatedFooter(plan: PlanSummary): PlanCardFooterItem {
  const updatedDate = timestampToDate(plan.updatedAt);

  return {
    label: 'Cập nhật',
    value: updatedDate ? formatRelativeTime(updatedDate) : 'vừa xong',
  };
}

function buildTypeFooter(plan: PlanSummary): PlanCardFooterItem {
  const joinedDate = timestampToDate(plan.joinedAt);

  return {
    label: 'Ngữ cảnh',
    value: joinedDate ? `${planTypeLabels[plan.planType]} · ${formatRelativeTime(joinedDate)}` : planTypeLabels[plan.planType],
  };
}

function buildTravelFooter(plan: PlanSummary): PlanCardFooterItem {
  const startDate = timestampToDate(plan.startDate);
  const endDate = timestampToDate(plan.endDate);

  return {
    label: 'Chuyến đi',
    value: startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : startDate ? formatDate(startDate) : 'Đang lên kế hoạch',
  };
}

function buildSavingFooter(plan: PlanSummary): PlanCardFooterItem {
  const targetDate = timestampToDate(plan.savingTargetDate);

  return {
    label: 'Mốc mục tiêu',
    value: targetDate ? formatDueCountdown(targetDate) : 'Chưa đặt mốc',
  };
}

function buildGeneralFooter(plan: PlanSummary): PlanCardFooterItem {
  const joinedDate = timestampToDate(plan.joinedAt);

  return {
    label: 'Tổng quan',
    value: joinedDate ? `${formatRelativeTime(joinedDate)}` : 'Đang theo dõi',
  };
}

function buildCountdownFooter(label: string, date: Date | null, fallback: string): PlanCardFooterItem {
  return {
    label,
    value: date ? formatDueCountdown(date) : fallback,
  };
}

function buildSharedLivingFooter(plan: PlanSummary): PlanCardFooterItem {
  const startDate = timestampToDate(plan.startDate);
  const endDate = timestampToDate(plan.endDate);

  return {
    label: 'Kỳ sinh hoạt',
    value:
      startDate && endDate
        ? `${formatDate(startDate)} - ${formatDate(endDate)}`
        : startDate
          ? formatDate(startDate)
          : 'Đang theo dõi',
  };
}

function buildBudgetProgress(plan: PlanSummary): PlanCardProgress | null {
  const budgetAmount = getSafeNumber(plan.budgetAmount);
  const totalExpense = getSafeNumber(plan.totalExpense);

  if (budgetAmount <= 0) {
    return null;
  }

  const tone = totalExpense > budgetAmount ? 'danger' : totalExpense >= budgetAmount * 0.8 ? 'warning' : 'primary';

  return {
    value: Math.min(totalExpense, budgetAmount),
    max: budgetAmount,
    label: `${getSafeCurrency(totalExpense)} / ${getSafeCurrency(budgetAmount)}`,
    tone,
  };
}

function buildSharedBalanceProgress(plan: PlanSummary): PlanCardProgress | null {
  const totalExpense = getSafeNumber(plan.totalExpense);
  const totalIncome = getSafeNumber(plan.totalIncome);

  if (totalExpense <= 0 || totalIncome <= 0) {
    return null;
  }

  return {
    value: Math.min(totalIncome, totalExpense),
    max: totalExpense,
    label: `${getSafeCurrency(totalIncome)} / ${getSafeCurrency(totalExpense)}`,
    tone: totalIncome >= totalExpense ? 'success' : 'warning',
  };
}

function buildBalanceProgress(plan: PlanSummary): PlanCardProgress | null {
  const totalIncome = getSafeNumber(plan.totalIncome);
  const balance = getSafeBalance(plan);

  if (totalIncome <= 0) {
    return null;
  }

  return {
    value: Math.max(balance, 0),
    max: totalIncome,
    label: `Số dư ${getSafeCurrency(balance)}`,
    tone: balance >= 0 ? 'success' : 'danger',
  };
}

function buildSavingProgress(plan: PlanSummary): PlanCardProgress | null {
  const savingGoalAmount = getSafeNumber(plan.savingGoalAmount);
  const savedAmount = Math.max(getSafeBalance(plan), 0);

  if (savingGoalAmount <= 0) {
    return null;
  }

  return {
    value: Math.min(savedAmount, savingGoalAmount),
    max: savingGoalAmount,
    label: `${getSafeCurrency(savedAmount)} / ${getSafeCurrency(savingGoalAmount)}`,
    tone: savedAmount >= savingGoalAmount ? 'success' : 'primary',
  };
}

function buildGeneralProgress(plan: PlanSummary): PlanCardProgress | null {
  const totalIncome = getSafeNumber(plan.totalIncome);
  const balance = getSafeBalance(plan);

  if (totalIncome <= 0) {
    return null;
  }

  return {
    value: Math.max(balance, 0),
    max: totalIncome,
    label: `Số dư ${getSafeCurrency(balance)}`,
    tone: balance >= 0 ? 'success' : 'danger',
  };
}

function buildTaskProgress(plan: PlanSummary): PlanCardProgress | null {
  const todoCount = getSafeNumber(plan.todoCount);
  const completedTodoCount = getSafeNumber(plan.completedTodoCount);

  if (todoCount <= 0) {
    return null;
  }

  return {
    value: completedTodoCount,
    max: todoCount,
    label: getSafeRatioLabel(completedTodoCount, todoCount, 'công việc hoàn thành'),
    tone: completedTodoCount >= todoCount ? 'success' : 'primary',
  };
}

function buildMilestoneProgress(plan: PlanSummary): PlanCardProgress | null {
  const milestoneCount = getSafeNumber(plan.milestoneCount);
  const completedMilestoneCount = getSafeNumber(plan.completedMilestoneCount);

  if (milestoneCount <= 0) {
    return null;
  }

  return {
    value: completedMilestoneCount,
    max: milestoneCount,
    label: getSafeRatioLabel(completedMilestoneCount, milestoneCount, 'cột mốc hoàn thành'),
    tone: completedMilestoneCount >= milestoneCount ? 'success' : 'primary',
  };
}

export const planCardConfigByType: Record<PlanType, PlanCardTypeConfig> = {
  travel: {
    primaryMetric: ({ plan }) => ({
      label: 'Ngân sách',
      value: getSafeCurrency(plan.budgetAmount),
      tone: 'primary',
    }),
    secondaryMetric: ({ plan }) => ({
      label: 'Đã chi',
      value: getSafeCurrency(plan.totalExpense),
      detail: getSafeCountLabel(plan.memberCount, 'người tham gia'),
    }),
    progress: ({ plan }) => buildBudgetProgress(plan),
    footerLeft: ({ plan }) => buildTravelFooter(plan),
  },
  wedding: {
    primaryMetric: ({ plan }) => ({
      label: 'Ngân sách',
      value: getSafeCurrency(plan.budgetAmount),
      tone: 'primary',
    }),
    secondaryMetric: ({ plan }) => ({
      label: 'Đã chi',
      value: getSafeCurrency(plan.totalExpense),
      detail: getSafeCountLabel(plan.memberCount, 'khách / thành viên'),
    }),
    progress: ({ plan }) => buildBudgetProgress(plan),
    footerLeft: ({ plan }) => buildCountdownFooter('Ngày cưới', timestampToDate(plan.endDate), 'Chưa đặt ngày'),
  },
  saving: {
    primaryMetric: ({ plan }) => ({
      label: 'Đã tích lũy',
      value: getSafeCurrency(getSafeBalance(plan)),
      tone: getSafeBalance(plan) >= 0 ? 'success' : 'warning',
    }),
    secondaryMetric: ({ plan }) => ({
      label: 'Mục tiêu',
      value: getSafeCurrency(plan.savingGoalAmount),
      tone: 'primary',
    }),
    progress: ({ plan }) => buildSavingProgress(plan),
    footerLeft: ({ plan }) => buildSavingFooter(plan),
  },
  birthday: {
    primaryMetric: ({ plan }) => ({
      label: 'Ngân sách',
      value: getSafeCurrency(plan.budgetAmount),
      tone: 'primary',
    }),
    secondaryMetric: ({ plan }) => ({
      label: 'Công việc',
      value: `${getSafeNumber(plan.completedTodoCount)}/${getSafeNumber(plan.todoCount)}`,
      detail: getSafeCountLabel(plan.memberCount, 'người tham gia'),
    }),
    progress: ({ plan }) => buildTaskProgress(plan),
    footerLeft: ({ plan }) => buildCountdownFooter('Sinh nhật', timestampToDate(plan.endDate), 'Chưa đặt ngày'),
  },
  event: {
    primaryMetric: ({ plan }) => ({
      label: 'Ngân sách',
      value: getSafeCurrency(plan.budgetAmount),
      tone: 'primary',
    }),
    secondaryMetric: ({ plan }) => ({
      label: 'Khách mời',
      value: String(getSafeNumber(plan.memberCount)),
      detail: getSafeCountLabel(plan.memberCount, 'người tham gia'),
    }),
    progress: ({ plan }) => buildTaskProgress(plan),
    footerLeft: ({ plan }) => buildCountdownFooter('Sự kiện', timestampToDate(plan.endDate), 'Chưa đặt ngày'),
  },
  shared_living: {
    primaryMetric: ({ plan }) => ({ label: 'Tổng chi', value: getSafeCurrency(plan.totalExpense), tone: 'primary' }),
    secondaryMetric: ({ plan }) => ({
      label: 'Đã đóng',
      value: getSafeCurrency(plan.totalIncome),
      tone: getSafeNumber(plan.totalIncome) >= getSafeNumber(plan.totalExpense) ? 'success' : 'default',
    }),
    progress: ({ plan }) => buildSharedBalanceProgress(plan),
    footerLeft: ({ plan }) => buildSharedLivingFooter(plan),
  },
  project: {
    primaryMetric: ({ plan }) => ({
      label: 'Hạn chót',
      value: plan.endDate ? formatDueCountdown(timestampToDate(plan.endDate) ?? new Date()) : 'Chưa đặt',
      tone: 'primary',
    }),
    secondaryMetric: ({ plan }) => ({
      label: 'Mốc',
      value: `${getSafeNumber(plan.completedMilestoneCount)}/${getSafeNumber(plan.milestoneCount)}`,
      detail: getSafeCountLabel(plan.memberCount, 'người tham gia'),
    }),
    progress: ({ plan }) => buildMilestoneProgress(plan),
    footerLeft: ({ plan }) => buildCountdownFooter('Tiến độ', timestampToDate(plan.endDate), 'Đang theo dõi'),
  },
  general: {
    primaryMetric: ({ plan }) => ({ label: 'Tổng thu', value: getSafeCurrency(plan.totalIncome), tone: 'success' }),
    secondaryMetric: ({ plan }) => ({
      label: 'Tổng chi',
      value: getSafeCurrency(plan.totalExpense),
      tone: getSafeNumber(plan.totalIncome) >= getSafeNumber(plan.totalExpense) ? 'default' : 'danger',
      detail: `Số dư ${getSafeCurrency(getSafeBalance(plan))}`,
    }),
    progress: ({ plan }) => buildGeneralProgress(plan),
    footerLeft: ({ plan }) => buildGeneralFooter(plan),
  },
};

export function buildPlanCardConfig(plan: PlanSummary) {
  const config = planCardConfigByType[plan.planType];

  return {
    primaryMetric: config.primaryMetric({ plan }),
    secondaryMetric: config.secondaryMetric({ plan }),
    progress: config.progress?.({ plan }) ?? null,
    footerLeft: config.footerLeft({ plan }),
    footerRight: buildUpdatedFooter(plan),
  };
}
