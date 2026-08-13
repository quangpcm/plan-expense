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

function formatCount(value: number, noun: string) {
  return `${value} ${noun}`;
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
  if (!plan.budgetAmount || plan.budgetAmount <= 0) {
    return null;
  }

  const tone = plan.totalExpense > plan.budgetAmount ? 'danger' : plan.totalExpense >= plan.budgetAmount * 0.8 ? 'warning' : 'primary';

  return {
    value: Math.min(plan.totalExpense, plan.budgetAmount),
    max: plan.budgetAmount,
    label: `${formatCurrency(plan.totalExpense)} / ${formatCurrency(plan.budgetAmount)}`,
    tone,
  };
}

function buildSharedBalanceProgress(plan: PlanSummary): PlanCardProgress | null {
  if (plan.totalExpense <= 0 || plan.totalIncome <= 0) {
    return null;
  }

  return {
    value: Math.min(plan.totalIncome, plan.totalExpense),
    max: plan.totalExpense,
    label: `${formatCurrency(plan.totalIncome)} / ${formatCurrency(plan.totalExpense)}`,
    tone: plan.totalIncome >= plan.totalExpense ? 'success' : 'warning',
  };
}

function buildBalanceProgress(plan: PlanSummary): PlanCardProgress | null {
  if (plan.totalIncome <= 0) {
    return null;
  }

  return {
    value: Math.max(plan.totalIncome - plan.totalExpense, 0),
    max: plan.totalIncome,
    label: `Số dư ${formatCurrency(plan.totalIncome - plan.totalExpense)}`,
    tone: plan.totalIncome >= plan.totalExpense ? 'success' : 'danger',
  };
}

function buildSavingProgress(plan: PlanSummary): PlanCardProgress | null {
  const savedAmount = Math.max(plan.totalIncome - plan.totalExpense, 0);

  if (!plan.savingGoalAmount || plan.savingGoalAmount <= 0) {
    return null;
  }

  return {
    value: Math.min(savedAmount, plan.savingGoalAmount),
    max: plan.savingGoalAmount,
    label: `${formatCurrency(savedAmount)} / ${formatCurrency(plan.savingGoalAmount)}`,
    tone: savedAmount >= plan.savingGoalAmount ? 'success' : 'primary',
  };
}

function buildGeneralProgress(plan: PlanSummary): PlanCardProgress | null {
  if (plan.totalIncome <= 0) {
    return null;
  }

  return {
    value: Math.max(plan.totalIncome - plan.totalExpense, 0),
    max: plan.totalIncome,
    label: `Số dư ${formatCurrency(plan.totalIncome - plan.totalExpense)}`,
    tone: plan.totalIncome >= plan.totalExpense ? 'success' : 'danger',
  };
}

function buildTaskProgress(plan: PlanSummary): PlanCardProgress | null {
  if (plan.todoCount <= 0) {
    return null;
  }

  return {
    value: plan.completedTodoCount,
    max: plan.todoCount,
    label: `${plan.completedTodoCount}/${plan.todoCount} công việc hoàn thành`,
    tone: plan.completedTodoCount >= plan.todoCount ? 'success' : 'primary',
  };
}

function buildMilestoneProgress(plan: PlanSummary): PlanCardProgress | null {
  if (plan.milestoneCount <= 0) {
    return null;
  }

  return {
    value: plan.completedMilestoneCount,
    max: plan.milestoneCount,
    label: `${plan.completedMilestoneCount}/${plan.milestoneCount} cột mốc hoàn thành`,
    tone: plan.completedMilestoneCount >= plan.milestoneCount ? 'success' : 'primary',
  };
}

export const planCardConfigByType: Record<PlanType, PlanCardTypeConfig> = {
  travel: {
    primaryMetric: ({ plan }) => ({
      label: 'Ngân sách',
      value: plan.budgetAmount != null ? formatCurrency(plan.budgetAmount) : 'Chưa đặt',
      tone: 'primary',
    }),
    secondaryMetric: ({ plan }) => ({ label: 'Đã chi', value: formatCurrency(plan.totalExpense), detail: formatCount(plan.memberCount, 'người tham gia') }),
    progress: ({ plan }) => buildBudgetProgress(plan),
    footerLeft: ({ plan }) => buildTravelFooter(plan),
  },
  wedding: {
    primaryMetric: ({ plan }) => ({
      label: 'Ngân sách',
      value: plan.budgetAmount != null ? formatCurrency(plan.budgetAmount) : 'Chưa đặt',
      tone: 'primary',
    }),
    secondaryMetric: ({ plan }) => ({
      label: 'Đã chi',
      value: formatCurrency(plan.totalExpense),
      detail: formatCount(plan.memberCount, 'khách / thành viên'),
    }),
    progress: ({ plan }) => buildBudgetProgress(plan),
    footerLeft: ({ plan }) => buildCountdownFooter('Ngày cưới', timestampToDate(plan.endDate), 'Chưa đặt ngày'),
  },
  saving: {
    primaryMetric: ({ plan }) => ({
      label: 'Đã tích lũy',
      value: formatCurrency(plan.totalIncome - plan.totalExpense),
      tone: plan.totalIncome >= plan.totalExpense ? 'success' : 'warning',
    }),
    secondaryMetric: ({ plan }) => ({
      label: 'Mục tiêu',
      value: plan.savingGoalAmount != null ? formatCurrency(plan.savingGoalAmount) : 'Chưa đặt',
      tone: 'primary',
    }),
    progress: ({ plan }) => buildSavingProgress(plan),
    footerLeft: ({ plan }) => buildSavingFooter(plan),
  },
  birthday: {
    primaryMetric: ({ plan }) => ({
      label: 'Ngân sách',
      value: plan.budgetAmount != null ? formatCurrency(plan.budgetAmount) : 'Chưa đặt',
      tone: 'primary',
    }),
    secondaryMetric: ({ plan }) => ({
      label: 'Công việc',
      value: `${plan.completedTodoCount}/${plan.todoCount}`,
      detail: formatCount(plan.memberCount, 'người tham gia'),
    }),
    progress: ({ plan }) => buildTaskProgress(plan),
    footerLeft: ({ plan }) => buildCountdownFooter('Sinh nhật', timestampToDate(plan.endDate), 'Chưa đặt ngày'),
  },
  event: {
    primaryMetric: ({ plan }) => ({
      label: 'Ngân sách',
      value: plan.budgetAmount != null ? formatCurrency(plan.budgetAmount) : 'Chưa đặt',
      tone: 'primary',
    }),
    secondaryMetric: ({ plan }) => ({
      label: 'Khách mời',
      value: String(plan.memberCount),
      detail: formatCount(plan.memberCount, 'người tham gia'),
    }),
    progress: ({ plan }) => buildTaskProgress(plan),
    footerLeft: ({ plan }) => buildCountdownFooter('Sự kiện', timestampToDate(plan.endDate), 'Chưa đặt ngày'),
  },
  shared_living: {
    primaryMetric: ({ plan }) => ({ label: 'Tổng chi', value: formatCurrency(plan.totalExpense), tone: 'primary' }),
    secondaryMetric: ({ plan }) => ({
      label: 'Đã đóng',
      value: formatCurrency(plan.totalIncome),
      tone: plan.totalIncome >= plan.totalExpense ? 'success' : 'default',
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
      value: `${plan.completedMilestoneCount}/${plan.milestoneCount}`,
      detail: formatCount(plan.memberCount, 'người tham gia'),
    }),
    progress: ({ plan }) => buildMilestoneProgress(plan),
    footerLeft: ({ plan }) => buildCountdownFooter('Tiến độ', timestampToDate(plan.endDate), 'Đang theo dõi'),
  },
  general: {
    primaryMetric: ({ plan }) => ({ label: 'Tổng thu', value: formatCurrency(plan.totalIncome), tone: 'success' }),
    secondaryMetric: ({ plan }) => ({
      label: 'Tổng chi',
      value: formatCurrency(plan.totalExpense),
      tone: plan.totalIncome >= plan.totalExpense ? 'default' : 'danger',
      detail: `Số dư ${formatCurrency(plan.totalIncome - plan.totalExpense)}`,
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
