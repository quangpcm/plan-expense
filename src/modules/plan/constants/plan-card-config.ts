import type { PlanType, PlanSummary } from '@/modules/plan/types/plan';
import type {
  PlanCardFooterItem,
  PlanCardMetric,
  PlanCardProgress,
} from '@/modules/plan/types/plan-card';
import { planTypeOptions } from '@/modules/plan/constants/plan.constants';
import {
  getEffectiveBudgetAmount,
  isEffectiveBudgetEstimated,
} from '@/modules/plan/utils/get-effective-budget-amount';
import { resolvePlanDebtModel } from '@/modules/plan/utils/plan-type-config';
import { formatCompactCurrency } from '@/shared/utils/currency';
import {
  formatDate,
  formatDueCountdown,
  formatRelativeTime,
} from '@/shared/utils/date';
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

const planTypeLabels = Object.fromEntries(
  planTypeOptions.map((option) => [option.value, option.label]),
) as Record<PlanType, string>;

function isEndedPlan(plan: PlanSummary) {
  return plan.planStatus === 'completed' || plan.planStatus === 'closed';
}

function getSafeNumber(value: number | null | undefined, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function getSafeCountLabel(value: number | null | undefined, noun: string) {
  return `${getSafeNumber(value)} ${noun}`;
}

// PlanCard's metric slots are fixed-width and truncate — full-precision formatCurrency produced
// mid-number ellipsis for large values (e.g. "315.602.00…"). formatCompactCurrency is already the
// established pattern for every other space-constrained card/summary slot in the app; it falls
// back to formatCurrency's own exact output below 1,000, so small/zero amounts are unaffected.
function getSafeCurrency(value: number | null | undefined) {
  return formatCompactCurrency(getSafeNumber(value));
}

function getSafeBalance(plan: PlanSummary) {
  return getSafeNumber(plan.totalIncome) - getSafeNumber(plan.totalExpense);
}

function getSafeDebtReceivableOutstanding(plan: PlanSummary) {
  return getSafeNumber(plan.debtReceivableOutstanding);
}

function getSafeDebtPayableOutstanding(plan: PlanSummary) {
  return getSafeNumber(plan.debtPayableOutstanding);
}

function getSafeEffectiveBudget(plan: PlanSummary) {
  return getEffectiveBudgetAmount(plan.budgetAmount, plan.estimatedAmount);
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

function buildEndedFooter(plan: PlanSummary): PlanCardFooterItem {
  const endedDate =
    timestampToDate(plan.endDate) ?? timestampToDate(plan.updatedAt);

  return {
    label: plan.planStatus === 'completed' ? 'Hoàn tất' : 'Dừng theo dõi',
    value: endedDate ? formatDate(endedDate) : 'Đã kết thúc',
  };
}

function buildTypeFooter(plan: PlanSummary): PlanCardFooterItem {
  const joinedDate = timestampToDate(plan.joinedAt);

  return {
    label: 'Ngữ cảnh',
    value: joinedDate
      ? `${planTypeLabels[plan.planType]} · ${formatRelativeTime(joinedDate)}`
      : planTypeLabels[plan.planType],
  };
}

function buildTravelFooter(plan: PlanSummary): PlanCardFooterItem {
  const startDate = timestampToDate(plan.startDate);
  const endDate = timestampToDate(plan.endDate);

  return {
    label: 'Chuyến đi',
    value:
      startDate && endDate
        ? `${formatDate(startDate)} - ${formatDate(endDate)}`
        : startDate
          ? formatDate(startDate)
          : 'Đang lên kế hoạch',
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

function buildCountdownFooter(
  label: string,
  date: Date | null,
  fallback: string,
): PlanCardFooterItem {
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
  const budgetAmount = getSafeEffectiveBudget(plan);
  const totalExpense = getSafeNumber(plan.totalExpense);

  if (budgetAmount <= 0) {
    return null;
  }

  const tone =
    totalExpense > budgetAmount
      ? 'danger'
      : totalExpense >= budgetAmount * 0.8
        ? 'warning'
        : 'primary';

  return {
    value: Math.min(totalExpense, budgetAmount),
    max: budgetAmount,
    label: `${getSafeCurrency(totalExpense)} / ${getSafeCurrency(budgetAmount)}`,
    tone,
    isMonetary: true,
  };
}

function buildSharedBalanceProgress(
  plan: PlanSummary,
): PlanCardProgress | null {
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
    isMonetary: true,
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
    isMonetary: true,
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
    isMonetary: true,
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
    isMonetary: true,
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
    label: getSafeRatioLabel(
      completedTodoCount,
      todoCount,
      'công việc hoàn thành',
    ),
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
    label: getSafeRatioLabel(
      completedMilestoneCount,
      milestoneCount,
      'cột mốc hoàn thành',
    ),
    tone: completedMilestoneCount >= milestoneCount ? 'success' : 'primary',
  };
}

function buildEndedSummaryConfig(plan: PlanSummary) {
  const balance = getSafeBalance(plan);
  const effectiveBudget = getSafeEffectiveBudget(plan);
  const hasBudget = effectiveBudget > 0;
  const hasSavingGoal = getSafeNumber(plan.savingGoalAmount) > 0;
  const hasTodo = getSafeNumber(plan.todoCount) > 0;
  const hasMilestone = getSafeNumber(plan.milestoneCount) > 0;

  if (plan.planType === 'saving' || hasSavingGoal) {
    return {
      primaryMetric: {
        label: 'Đã tích lũy',
        value: getSafeCurrency(Math.max(balance, 0)),
        tone:
          balance >= getSafeNumber(plan.savingGoalAmount)
            ? 'success'
            : 'primary',
        isMonetary: true,
      } satisfies PlanCardMetric,
      secondaryMetric: {
        label: 'Mục tiêu',
        value: getSafeCurrency(plan.savingGoalAmount),
        isMonetary: true,
      } satisfies PlanCardMetric,
      progress: buildSavingProgress(plan),
      footerLeft: buildEndedFooter(plan),
    };
  }

  if (plan.planType === 'project' || hasMilestone) {
    return {
      primaryMetric: {
        label: 'Mốc hoàn tất',
        value: `${getSafeNumber(plan.completedMilestoneCount)}/${getSafeNumber(plan.milestoneCount)}`,
        tone:
          getSafeNumber(plan.completedMilestoneCount) >=
          getSafeNumber(plan.milestoneCount)
            ? 'success'
            : 'primary',
      } satisfies PlanCardMetric,
      secondaryMetric: {
        label: 'Công việc xong',
        value: `${getSafeNumber(plan.completedTodoCount)}/${getSafeNumber(plan.todoCount)}`,
        detail: getSafeCountLabel(plan.memberCount, 'người tham gia'),
      } satisfies PlanCardMetric,
      progress: buildMilestoneProgress(plan) ?? buildTaskProgress(plan),
      footerLeft: buildEndedFooter(plan),
    };
  }

  if (plan.planType === 'birthday' || plan.planType === 'event' || hasTodo) {
    return {
      primaryMetric: {
        label: 'Tổng chi',
        value: getSafeCurrency(plan.totalExpense),
        tone:
          hasBudget && getSafeNumber(plan.totalExpense) <= effectiveBudget
            ? 'primary'
            : 'danger',
        isMonetary: true,
      } satisfies PlanCardMetric,
      secondaryMetric: {
        label: 'Công việc xong',
        value: `${getSafeNumber(plan.completedTodoCount)}/${getSafeNumber(plan.todoCount)}`,
        detail: getSafeCountLabel(plan.memberCount, 'người tham gia'),
      } satisfies PlanCardMetric,
      progress: buildTaskProgress(plan) ?? buildBudgetProgress(plan),
      footerLeft: buildEndedFooter(plan),
    };
  }

  if (plan.planType === 'shared_living') {
    return {
      primaryMetric: {
        label: 'Tổng thu',
        value: getSafeCurrency(plan.totalIncome),
        tone: 'success',
        isMonetary: true,
      } satisfies PlanCardMetric,
      secondaryMetric: {
        label: 'Tổng chi',
        value: getSafeCurrency(plan.totalExpense),
        tone: balance >= 0 ? 'default' : 'danger',
        detail: `Số dư ${getSafeCurrency(balance)}`,
        isMonetary: true,
        detailIsMonetary: true,
      } satisfies PlanCardMetric,
      progress: buildSharedBalanceProgress(plan) ?? buildGeneralProgress(plan),
      footerLeft: buildEndedFooter(plan),
    };
  }

  return {
    primaryMetric: {
      label: hasBudget ? 'Ngân sách' : 'Tổng thu',
      value: hasBudget
        ? getSafeCurrency(effectiveBudget)
        : getSafeCurrency(plan.totalIncome),
      tone: hasBudget ? 'primary' : 'success',
      isMonetary: true,
    } satisfies PlanCardMetric,
    secondaryMetric: {
      label: 'Tổng chi',
      value: getSafeCurrency(plan.totalExpense),
      tone:
        hasBudget && getSafeNumber(plan.totalExpense) > effectiveBudget
          ? 'danger'
          : 'default',
      detail:
        plan.planType === 'travel' || plan.planType === 'wedding'
          ? getSafeCountLabel(plan.memberCount, 'người tham gia')
          : `Số dư ${getSafeCurrency(balance)}`,
      isMonetary: true,
      detailIsMonetary: !(
        plan.planType === 'travel' || plan.planType === 'wedding'
      ),
    } satisfies PlanCardMetric,
    progress: hasBudget
      ? buildBudgetProgress(plan)
      : buildGeneralProgress(plan),
    footerLeft: buildEndedFooter(plan),
  };
}

export const planCardConfigByType: Record<PlanType, PlanCardTypeConfig> = {
  debt:
    // native_debt (docs/debt-plan-specs.md): công nợ derive từ debtTransactions, không còn Finance,
    // nên card đọc từ debtReceivableOutstanding/debtPayableOutstanding thay vì totalIncome/totalExpense.
    {
      primaryMetric: ({ plan }) =>
        resolvePlanDebtModel(plan) === 'native_debt'
          ? {
              label: 'Phải thu',
              value: getSafeCurrency(getSafeDebtReceivableOutstanding(plan)),
              tone: 'primary',
              isMonetary: true,
            }
          : {
              label: 'Dòng tiền ròng',
              value: getSafeCurrency(getSafeBalance(plan)),
              tone: getSafeBalance(plan) >= 0 ? 'warning' : 'danger',
              isMonetary: true,
            },
      secondaryMetric: ({ plan }) =>
        resolvePlanDebtModel(plan) === 'native_debt'
          ? {
              label: 'Phải trả',
              value: getSafeCurrency(getSafeDebtPayableOutstanding(plan)),
              isMonetary: true,
            }
          : {
              label: 'Đã nhận giải ngân',
              value: getSafeCurrency(plan.totalIncome),
              detail: `Đã trả / chi ${getSafeCurrency(plan.totalExpense)}`,
              isMonetary: true,
              detailIsMonetary: true,
            },
      progress: ({ plan }) => (resolvePlanDebtModel(plan) === 'native_debt' ? null : buildBalanceProgress(plan)),
      footerLeft: ({ plan }) => ({
        label: 'Theo dõi nợ',
        value: isEndedPlan(plan)
          ? buildEndedFooter(plan).value
          : getSafeCountLabel(plan.memberCount, 'thành viên liên quan'),
      }),
    },
  travel: {
    primaryMetric: ({ plan }) => ({
      label: 'Ngân sách',
      value: getSafeCurrency(getSafeEffectiveBudget(plan)),
      tone: 'primary',
      isMonetary: true,
    }),
    secondaryMetric: ({ plan }) => ({
      label: 'Đã chi',
      value: getSafeCurrency(plan.totalExpense),
      detail: getSafeCountLabel(plan.memberCount, 'người tham gia'),
      isMonetary: true,
    }),
    progress: ({ plan }) => buildBudgetProgress(plan),
    footerLeft: ({ plan }) => buildTravelFooter(plan),
  },
  wedding: {
    primaryMetric: ({ plan }) => ({
      label: isEffectiveBudgetEstimated(plan.budgetAmount, plan.estimatedAmount)
        ? 'Dự chi'
        : 'Ngân sách',
      value: getSafeCurrency(getSafeEffectiveBudget(plan)),
      tone: 'primary',
      isMonetary: true,
    }),
    secondaryMetric: ({ plan }) => ({
      label: 'Đã chi',
      value: getSafeCurrency(plan.totalExpense),
      detail: getSafeCountLabel(plan.memberCount, 'khách / thành viên'),
      isMonetary: true,
    }),
    progress: ({ plan }) => buildBudgetProgress(plan),
    footerLeft: ({ plan }) =>
      buildCountdownFooter(
        'Ngày cưới',
        timestampToDate(plan.endDate),
        'Chưa đặt ngày',
      ),
  },
  saving: {
    primaryMetric: ({ plan }) => ({
      label: 'Đã tích lũy',
      value: getSafeCurrency(getSafeBalance(plan)),
      tone: getSafeBalance(plan) >= 0 ? 'success' : 'warning',
      isMonetary: true,
    }),
    secondaryMetric: ({ plan }) => ({
      label: 'Mục tiêu',
      value: getSafeCurrency(plan.savingGoalAmount),
      tone: 'primary',
      isMonetary: true,
    }),
    progress: ({ plan }) => buildSavingProgress(plan),
    footerLeft: ({ plan }) => buildSavingFooter(plan),
  },
  birthday: {
    primaryMetric: ({ plan }) => ({
      label: 'Ngân sách',
      value: getSafeCurrency(getSafeEffectiveBudget(plan)),
      tone: 'primary',
      isMonetary: true,
    }),
    secondaryMetric: ({ plan }) => ({
      label: 'Công việc',
      value: `${getSafeNumber(plan.completedTodoCount)}/${getSafeNumber(plan.todoCount)}`,
      detail: getSafeCountLabel(plan.memberCount, 'người tham gia'),
    }),
    progress: ({ plan }) => buildTaskProgress(plan),
    footerLeft: ({ plan }) =>
      buildCountdownFooter(
        'Sinh nhật',
        timestampToDate(plan.endDate),
        'Chưa đặt ngày',
      ),
  },
  event: {
    primaryMetric: ({ plan }) => ({
      label: 'Ngân sách',
      value: getSafeCurrency(getSafeEffectiveBudget(plan)),
      tone: 'primary',
    }),
    secondaryMetric: ({ plan }) => ({
      label: 'Khách mời',
      value: String(getSafeNumber(plan.memberCount)),
      detail: getSafeCountLabel(plan.memberCount, 'người tham gia'),
    }),
    progress: ({ plan }) => buildTaskProgress(plan),
    footerLeft: ({ plan }) =>
      buildCountdownFooter(
        'Sự kiện',
        timestampToDate(plan.endDate),
        'Chưa đặt ngày',
      ),
  },
  shared_living: {
    primaryMetric: ({ plan }) => ({
      label: 'Tổng chi',
      value: getSafeCurrency(plan.totalExpense),
      tone: 'primary',
      isMonetary: true,
    }),
    secondaryMetric: ({ plan }) => ({
      label: 'Đã đóng',
      value: getSafeCurrency(plan.totalIncome),
      tone:
        getSafeNumber(plan.totalIncome) >= getSafeNumber(plan.totalExpense)
          ? 'success'
          : 'default',
      isMonetary: true,
    }),
    progress: ({ plan }) => buildSharedBalanceProgress(plan),
    footerLeft: ({ plan }) => buildSharedLivingFooter(plan),
  },
  project: {
    primaryMetric: ({ plan }) => ({
      label: 'Hạn chót',
      value: plan.endDate
        ? formatDueCountdown(timestampToDate(plan.endDate) ?? new Date())
        : 'Chưa đặt',
      tone: 'primary',
    }),
    secondaryMetric: ({ plan }) => ({
      label: 'Mốc',
      value: `${getSafeNumber(plan.completedMilestoneCount)}/${getSafeNumber(plan.milestoneCount)}`,
      detail: getSafeCountLabel(plan.memberCount, 'người tham gia'),
    }),
    progress: ({ plan }) => buildMilestoneProgress(plan),
    footerLeft: ({ plan }) =>
      buildCountdownFooter(
        'Tiến độ',
        timestampToDate(plan.endDate),
        'Đang theo dõi',
      ),
  },
  general: {
    primaryMetric: ({ plan }) => ({
      label: 'Tổng thu',
      value: getSafeCurrency(plan.totalIncome),
      tone: 'success',
      isMonetary: true,
    }),
    secondaryMetric: ({ plan }) => ({
      label: 'Tổng chi',
      value: getSafeCurrency(plan.totalExpense),
      tone:
        getSafeNumber(plan.totalIncome) >= getSafeNumber(plan.totalExpense)
          ? 'default'
          : 'danger',
      detail: `Số dư ${getSafeCurrency(getSafeBalance(plan))}`,
      isMonetary: true,
      detailIsMonetary: true,
    }),
    progress: ({ plan }) => buildGeneralProgress(plan),
    footerLeft: ({ plan }) => buildGeneralFooter(plan),
  },
};

export function buildPlanCardConfig(plan: PlanSummary) {
  if (isEndedPlan(plan)) {
    return {
      ...buildEndedSummaryConfig(plan),
      footerRight: buildUpdatedFooter(plan),
    };
  }

  const config = planCardConfigByType[plan.planType];

  return {
    primaryMetric: config.primaryMetric({ plan }),
    secondaryMetric: config.secondaryMetric({ plan }),
    progress: config.progress?.({ plan }) ?? null,
    footerLeft: config.footerLeft({ plan }),
    footerRight: buildUpdatedFooter(plan),
  };
}
