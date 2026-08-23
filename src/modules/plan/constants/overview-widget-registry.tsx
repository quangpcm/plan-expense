'use client';

import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  MapPinned,
  Users,
} from 'lucide-react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { getCategoryIcon } from '@/modules/category/utils/category-icon';
import { MilestoneList } from '@/modules/milestone';
import { CategoryBreakdown } from '@/modules/statistic/components/category-breakdown';
import { resolveCategoryColor } from '@/modules/statistic/components/finance-category-donut';
import { MilestoneBreakdown } from '@/modules/statistic/components/milestone-breakdown';
import { StatisticOverview } from '@/modules/statistic/components/statistic-overview';
import { SettlementProgressSummary } from '@/modules/settlement/components/settlement-progress-summary';
import { computeSettlementProgress } from '@/modules/settlement/utils/settlement-progress';
import { TodoList } from '@/modules/todo';
import {
  calculateDebtAttentionItems,
  isDebtTransactionCashIn,
} from '@/modules/debt-tracking/calculators/debt-calculators';
import { getDebtTransactionCategoryLabel } from '@/modules/debt-tracking/constants/debt-transaction-category';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  formatDate,
  formatDateTime,
  formatDueCountdown,
  getDueUrgency,
} from '@/shared/utils/date';
import { formatCompactCurrency, formatCurrency } from '@/shared/utils/currency';
import { timestampToDate } from '@/shared/utils/firebase';
import { cn } from '@/shared/utils/cn';
import type {
  OverviewWidgetDefinition,
  OverviewWidgetId,
} from '@/modules/plan/types/plan-modular';
import type { OverviewRendererProps } from '@/modules/plan/components/overview-renderer';
import { resolvePlanDebtModel } from '@/modules/plan/utils/plan-type-config';
import { weddingOverviewWidgetRegistry } from '@/modules/plan/constants/overview-widget-registry.wedding';
import { getTravelActivityCategoryMeta } from '@/modules/travel-activity/utils/travel-activity-display';

type OverviewWidgetComponent = (
  props: OverviewRendererProps,
) => React.JSX.Element;

export type OverviewWidgetRendererDefinition = OverviewWidgetDefinition & {
  component: OverviewWidgetComponent;
  isAvailable: (props: OverviewRendererProps) => boolean;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function formatDateRange(startDate: Date | null, endDate: Date | null) {
  if (startDate && endDate) {
    return `${formatDate(startDate)} → ${formatDate(endDate)}`;
  }

  if (startDate) {
    return `Bắt đầu ${formatDate(startDate)}`;
  }

  if (endDate) {
    return `Đến ${formatDate(endDate)}`;
  }

  return 'Chưa thiết lập thời gian chuyến đi';
}

function getInclusiveDayCount(startDate: Date | null, endDate: Date | null) {
  if (!startDate || !endDate) {
    return null;
  }

  const startDay = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  );
  const endDay = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate(),
  );

  return Math.max(
    1,
    Math.round((endDay.getTime() - startDay.getTime()) / ONE_DAY_MS) + 1,
  );
}

function getDaysUntil(date: Date) {
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  return Math.round(
    (targetDay.getTime() - startOfToday.getTime()) / ONE_DAY_MS,
  );
}

function getPlanDates(
  plan: OverviewRendererProps['plan'],
): { startDate: Date | null; endDate: Date | null } {
  if (typeof plan === 'string') {
    return { startDate: null, endDate: null };
  }

  return {
    startDate: timestampToDate(plan.startDate),
    endDate: timestampToDate(plan.endDate),
  };
}

function resolveUpcomingActivity(
  travelActivities: OverviewRendererProps['travelActivities'],
) {
  const now = Date.now();
  const sortedActivities = [...travelActivities].sort(
    (left, right) => left.startsAt.toMillis() - right.startsAt.toMillis(),
  );

  return (
    sortedActivities.find((activity) => {
      const endTime = activity.endsAt?.toMillis() ?? activity.startsAt.toMillis();
      return endTime >= now;
    }) ??
    sortedActivities.find((activity) => activity.startsAt.toMillis() >= now) ??
    sortedActivities[sortedActivities.length - 1] ??
    null
  );
}

function resolvePendingTodos(todos: OverviewRendererProps['todos']) {
  return todos.filter(
    (todo) => todo.status !== 'done' && todo.status !== 'cancelled',
  );
}

function getMilestoneProgress(milestone: OverviewRendererProps['visibleMilestones'][number]) {
  if (milestone.todoCount <= 0) {
    return 0;
  }

  return Math.round((milestone.completedTodoCount / milestone.todoCount) * 100);
}

function getMilestoneStartDate(
  milestone: OverviewRendererProps['visibleMilestones'][number],
) {
  return timestampToDate(milestone.startDate) ?? timestampToDate(milestone.endDate);
}

function getTravelMilestoneCountdown(
  milestone: OverviewRendererProps['visibleMilestones'][number],
) {
  const startDate = getMilestoneStartDate(milestone);

  if (!startDate) {
    return {
      label: milestone.status === 'in_progress' ? 'Đang diễn ra' : 'Sắp tới',
      toneClass: 'bg-sky-50 text-sky-700',
      dateLabel: 'Chưa có ngày bắt đầu',
    };
  }

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const startOfTarget = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  );
  const dayDiff = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / ONE_DAY_MS,
  );

  if (milestone.status === 'in_progress') {
    return {
      label: 'Đang diễn ra',
      toneClass: 'bg-sky-50 text-sky-700',
      dateLabel: formatDate(startDate),
    };
  }

  if (dayDiff < 0) {
    return {
      label: `Trễ ${Math.abs(dayDiff)} ngày`,
      toneClass: 'bg-rose-100 text-rose-700',
      dateLabel: formatDate(startDate),
    };
  }

  if (dayDiff === 0) {
    return {
      label: 'Đến hạn hôm nay',
      toneClass: 'bg-amber-100 text-amber-700',
      dateLabel: formatDate(startDate),
    };
  }

  if (dayDiff === 1) {
    return {
      label: 'Ngày mai',
      toneClass: 'bg-amber-100 text-amber-700',
      dateLabel: formatDate(startDate),
    };
  }

  if (dayDiff <= 7) {
    return {
      label: `Còn ${dayDiff} ngày`,
      toneClass: 'bg-amber-100 text-amber-700',
      dateLabel: formatDate(startDate),
    };
  }

  return {
    label: `Còn ${dayDiff} ngày`,
    toneClass: 'bg-sky-50 text-sky-700',
    dateLabel: formatDate(startDate),
  };
}

function TravelTripStatusWidget({
  isPlanEnded,
  members,
  plan,
  planStatus,
  travelActivities,
}: OverviewRendererProps) {
  const { startDate, endDate } = getPlanDates(plan);
  const durationDays = getInclusiveDayCount(startDate, endDate);
  const now = new Date();
  const todayLabel = formatDateRange(startDate, endDate);
  const locationLabel =
    travelActivities
      .map((activity) => activity.locationName?.trim())
      .filter((value): value is string => Boolean(value))
      .slice(0, 2)
      .join(' → ') || 'Lịch trình sẽ rõ hơn khi thêm địa điểm';

  let title = 'Chưa thiết lập ngày đi';
  let subtitle = todayLabel;

  if (startDate && !isPlanEnded && startDate > now) {
    const daysUntil = getDaysUntil(startDate);
    title = daysUntil <= 0 ? 'Khởi hành hôm nay' : `Còn ${daysUntil} ngày`;
    subtitle = durationDays
      ? `${todayLabel} · ${durationDays} ngày`
      : todayLabel;
  } else if (startDate && endDate && !isPlanEnded && endDate >= now) {
    const currentDay = Math.max(1, durationDays ? durationDays - getDaysUntil(endDate) : 1);
    title = durationDays ? `Ngày ${currentDay} / ${durationDays}` : 'Đang trong chuyến đi';
    subtitle = 'Đang trong chuyến đi';
  } else if (isPlanEnded) {
    title = planStatus === 'completed' ? 'Đã hoàn thành' : 'Đã kết thúc';
    subtitle = durationDays
      ? `${durationDays} ngày · ${travelActivities.length} hoạt động`
      : `${travelActivities.length} hoạt động`;
  }

  return (
    <Card className="overflow-hidden border-slate-200 bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(255,255,255,0.96)_42%,rgba(15,23,42,0.03))]">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.9fr)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            Chuyến đi
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>

          <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-700">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5">
              <CalendarDays className="size-4 text-sky-700" />
              {todayLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5">
              <Users className="size-4 text-sky-700" />
              {members.length} thành viên
            </span>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
            Hành trình
          </p>
          <p className="mt-2 flex items-start gap-2 text-sm font-medium text-slate-900">
            <MapPinned className="mt-0.5 size-4 shrink-0 text-sky-700" />
            <span>{locationLabel}</span>
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {travelActivities.length > 0
              ? `${travelActivities.length} hoạt động đã được lên lịch cho chuyến đi này.`
              : 'Chưa có hoạt động nào trong lịch trình, bạn có thể bắt đầu từ tab Lịch trình.'}
          </p>
        </div>
      </div>
    </Card>
  );
}

function TravelPlanningProgressWidget({
  estimatedByMilestoneId,
  onOpenPlanningMilestones,
  onSelectUpcomingMilestone,
  upcomingMilestones,
  visibleMilestones,
}: OverviewRendererProps) {
  const currentMilestone =
    visibleMilestones.find((milestone) => milestone.status === 'in_progress') ??
    null;
  const nextMilestone =
    visibleMilestones.find((milestone) => {
      if (milestone.status === 'cancelled' || milestone.status === 'completed') {
        return false;
      }

      if (currentMilestone) {
        return milestone.id !== currentMilestone.id &&
          milestone.orderIndex > currentMilestone.orderIndex;
      }

      return milestone.status === 'upcoming';
    }) ?? null;
  const currentProgress = currentMilestone ? getMilestoneProgress(currentMilestone) : 0;
  const nextProgress = nextMilestone ? getMilestoneProgress(nextMilestone) : 0;
  const nextCountdown = nextMilestone ? getTravelMilestoneCountdown(nextMilestone) : null;

  return (
    <div className="space-y-3">
      <SectionHeading
        eyebrow="Kế hoạch"
        title="Mốc sắp tới"
        description="Hiển thị mốc hiện tại, mốc tiếp theo và countdown để nhìn nhanh mức độ sẵn sàng."
      />
      <Card className="space-y-5">
        {currentMilestone ? (
          <div className="space-y-4">
            <button
              className="block w-full rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
              onClick={() => onSelectUpcomingMilestone(currentMilestone.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    Hiện tại
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">
                    {currentMilestone.title}
                  </p>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  Đang diễn ra
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {currentMilestone.completedTodoCount}/{currentMilestone.todoCount} công việc · {currentProgress}%
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-sky-600 transition-[width]"
                  style={{ width: `${currentProgress}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-950">
                  {formatCompactCurrency(currentMilestone.totalExpense)}
                </span>{' '}
                đã chi
                {estimatedByMilestoneId[currentMilestone.id]
                  ? ` · ${formatCompactCurrency(
                      estimatedByMilestoneId[currentMilestone.id] ?? 0,
                    )} dự kiến`
                  : ''}
              </p>
            </button>

            {nextMilestone ? (
              <button
                className="block w-full rounded-[24px] border border-dashed border-slate-200 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
                onClick={() => onSelectUpcomingMilestone(nextMilestone.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    Tiếp theo
                  </p>
                  {nextCountdown ? (
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-semibold',
                        nextCountdown.toneClass,
                      )}
                    >
                      {nextCountdown.label}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {nextMilestone.title}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {nextCountdown?.dateLabel ?? 'Chưa có ngày bắt đầu'}
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  {nextMilestone.completedTodoCount}/{nextMilestone.todoCount} công việc · {nextProgress}%
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-slate-500 transition-[width]"
                    style={{ width: `${nextProgress}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  {estimatedByMilestoneId[nextMilestone.id]
                    ? `Dự kiến ${formatCompactCurrency(
                        estimatedByMilestoneId[nextMilestone.id] ?? 0,
                      )}`
                    : 'Chưa có chi phí dự kiến'}
                </p>
              </button>
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-200 px-4 py-4 text-sm leading-6 text-slate-600">
                Đây là mốc cuối của kế hoạch.
              </div>
            )}
          </div>
        ) : nextMilestone ? (
          <button
            className="block w-full rounded-[24px] border border-dashed border-slate-200 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
            onClick={() => onSelectUpcomingMilestone(nextMilestone.id)}
            type="button"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Mốc tiếp theo
              </p>
              {nextCountdown ? (
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold',
                    nextCountdown.toneClass,
                  )}
                >
                  {nextCountdown.label}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {nextMilestone.title}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {nextCountdown?.dateLabel ?? 'Chưa có ngày bắt đầu'}
            </p>
            <p className="mt-3 text-sm text-slate-600">
              {nextMilestone.completedTodoCount}/{nextMilestone.todoCount} công việc · {nextProgress}%
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-slate-500 transition-[width]"
                style={{ width: `${nextProgress}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {estimatedByMilestoneId[nextMilestone.id]
                ? `Dự kiến ${formatCompactCurrency(
                    estimatedByMilestoneId[nextMilestone.id] ?? 0,
                  )}`
                : 'Chưa có chi phí dự kiến'}
            </p>
          </button>
        ) : (
          <p className="text-sm leading-6 text-slate-600">
            Các mốc kế hoạch đã hoàn thành.
          </p>
        )}

        <div className="flex justify-end">
          <button
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] transition hover:text-[color:color-mix(in_srgb,var(--color-primary)_78%,black)]"
            onClick={onOpenPlanningMilestones}
            type="button"
          >
            Xem tất cả mốc <ArrowRight className="size-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}

function TravelAttentionTodosWidget({
  members,
  onOpenPlanningTodos,
  onViewTodo,
  todos,
  upcomingTodos,
  visibleMilestones,
}: OverviewRendererProps) {
  const pendingTodos = resolvePendingTodos(todos);
  const visibleTodos = upcomingTodos.slice(0, 4);
  const dueSoonCount = upcomingTodos.filter((todo) => {
    if (!todo.dueDate) {
      return false;
    }

    const urgency = getDueUrgency(todo.dueDate.toDate());
    return urgency === 'overdue' || urgency === 'danger' || urgency === 'warning';
  }).length;

  return (
    <div className="space-y-3">
      <SectionHeading
        eyebrow={dueSoonCount > 0 ? 'Cần chú ý' : 'Công việc'}
        title={dueSoonCount > 0 ? `${dueSoonCount} việc sắp đến hạn` : `${pendingTodos.length} việc chưa hoàn thành`}
        description={
          dueSoonCount > 0
            ? 'Những đầu việc cần được xử lý sớm để chuyến đi không bị dồn việc.'
            : 'Không có việc nào sắp đến hạn, nhưng vẫn còn việc mở cần theo dõi.'
        }
      />
      <Card className="space-y-4">
        {visibleTodos.length === 0 ? (
          <div className="flex items-center gap-3 rounded-[24px] bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>Không có việc nào sắp đến hạn.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleTodos.map((todo) => {
              const dueDate = todo.dueDate?.toDate() ?? null;
              const urgency = dueDate ? getDueUrgency(dueDate) : 'normal';
              const assignee =
                members.find((member) => member.id === todo.assigneeMemberId) ?? null;
              const milestone =
                visibleMilestones.find((item) => item.id === todo.milestoneId) ?? null;

              return (
                <button
                  className="flex w-full items-start justify-between gap-4 rounded-[24px] border border-slate-200 px-4 py-3 text-left transition hover:border-sky-200 hover:bg-sky-50/40"
                  key={todo.id}
                  onClick={() => onViewTodo(todo)}
                  type="button"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {todo.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {assignee ? assignee.nickname : 'Chưa giao người phụ trách'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {milestone?.title ?? 'Chưa thuộc milestone nào'}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        urgency === 'overdue'
                          ? 'text-rose-600'
                          : urgency === 'danger'
                            ? 'text-amber-700'
                            : urgency === 'warning'
                              ? 'text-sky-700'
                              : 'text-slate-500',
                      )}
                    >
                      {dueDate ? formatDueCountdown(dueDate) : 'Chưa có hạn'}
                    </p>
                    {dueDate ? (
                      <p className="mt-1 text-xs text-slate-400">
                        {formatDate(dueDate)}
                      </p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex justify-end">
          <button
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] transition hover:text-[color:color-mix(in_srgb,var(--color-primary)_78%,black)]"
            onClick={onOpenPlanningTodos}
            type="button"
          >
            Xem tất cả công việc <ArrowRight className="size-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}

function PlanSummaryWidget({
  endedPlanDate,
  isPlanEnded,
  members,
  planStatus,
  statistic,
}: OverviewRendererProps) {
  const endedAtLabel = endedPlanDate
    ? formatDate(endedPlanDate)
    : 'Đã kết thúc';

  return (
    <Card className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
          Trạng thái
        </p>
        <p className="mt-1 text-lg font-semibold text-slate-950">
          {planStatus === 'completed'
            ? 'Hoàn thành'
            : planStatus === 'closed'
              ? 'Dừng theo dõi'
              : 'Đang hoạt động'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {isPlanEnded ? endedAtLabel : 'Đang theo dõi tiến độ'}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
          Thành viên
        </p>
        <p className="mt-1 text-lg font-semibold text-slate-950">
          {members.length}
        </p>
        <p className="mt-1 text-sm text-slate-500">Đang tham gia kế hoạch</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
          Tổng thu
        </p>
        <p className="mt-1 text-lg font-semibold text-emerald-700">
          {formatCurrency(statistic.overview.totalIncome)}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
          Tổng chi
        </p>
        <p className="mt-1 text-lg font-semibold text-slate-950">
          {formatCurrency(statistic.overview.totalExpense)}
        </p>
      </div>
    </Card>
  );
}

function PlanningSnapshotWidget({
  estimatedByMilestoneId,
  isMilestonesLoading,
  isTodosLoading,
  members,
  milestoneActionError,
  onOpenPlanningMilestones,
  onOpenPlanningTodos,
  onSelectUpcomingMilestone,
  onViewTodo,
  selectedMilestoneId,
  todoActionError,
  upcomingMilestones,
  upcomingTodos,
  visibleMilestones,
}: OverviewRendererProps) {
  return (
    <>
      <div className="space-y-3">
        <SectionHeading eyebrow="Mốc kế hoạch" title="Mốc sắp tới" />
        {milestoneActionError ? (
          <AuthFormMessage message={milestoneActionError} type="error" />
        ) : null}
        {isMilestonesLoading ? (
          <Skeleton className="h-32 rounded-[28px]" />
        ) : (
          <MilestoneList
            canManagePlan={false}
            emptyLabel="Không có mốc nào đang diễn ra hoặc sắp diễn ra."
            estimatedByMilestoneId={estimatedByMilestoneId}
            isSubmitting={false}
            milestones={upcomingMilestones}
            onEdit={onOpenPlanningMilestones}
            onMoveDown={() => {}}
            onMoveUp={() => {}}
            onSelect={onSelectUpcomingMilestone}
            selectedMilestoneId={selectedMilestoneId}
          />
        )}
      </div>

      <div className="space-y-3">
        <SectionHeading
          eyebrow="Công việc"
          title="Việc sắp đến hạn"
          description="5 việc chưa hoàn thành"
        />
        {todoActionError ? (
          <AuthFormMessage message={todoActionError} type="error" />
        ) : null}
        {isTodosLoading ? (
          <Skeleton className="h-32 rounded-[28px]" />
        ) : (
          <TodoList
            className="sm:grid-cols-2 lg:grid-cols-3"
            emptyMessage="Không có công việc nào sắp đến hạn."
            members={members}
            milestones={visibleMilestones}
            preserveOrder
            onViewTodo={onViewTodo}
            todos={upcomingTodos}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          onClick={onOpenPlanningMilestones}
          type="button"
        >
          Xem tất cả mốc
        </button>
        <button
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          onClick={onOpenPlanningTodos}
          type="button"
        >
          Xem tất cả công việc
        </button>
      </div>
    </>
  );
}

function FinanceSummaryWidget({
  isPlanEnded,
  onOpenFinance,
  onSelectMilestoneDrilldown,
  statistic,
}: OverviewRendererProps) {
  return (
    <div className="space-y-3">
      <SectionHeading
        action={
          <button
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] transition hover:text-[color:color-mix(in_srgb,var(--color-primary)_78%,black)]"
            onClick={onOpenFinance}
            type="button"
          >
            Mở thống kê <ArrowRight className="size-4" />
          </button>
        }
        eyebrow="Tài chính"
        title="Thu chi kế hoạch"
      />
      {isPlanEnded ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <CategoryBreakdown statistic={statistic} />
          <MilestoneBreakdown
            onSelectMilestoneMember={onSelectMilestoneDrilldown}
            statistic={statistic}
          />
        </div>
      ) : (
        <StatisticOverview statistic={statistic} />
      )}
    </div>
  );
}

// Travel-only KPI row: nhãn "Nạp quỹ" thay "Tổng thu" vì Income trong app này
// luôn là tiền góp vào quỹ chung, không phải revenue của chuyến đi — giữ
// "Thành viên" thay vì "Bình quân/người" vì participant có thể khác nhau
// trên từng expense, chia đều tổng chi/số thành viên sẽ ra một con số sai
// nghĩa nghiệp vụ.
function TravelFinanceKpiRow({ statistic }: { statistic: OverviewRendererProps['statistic'] }) {
  return (
    <Card className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Tổng chi</p>
        <p className="mt-1 text-lg font-semibold text-slate-950">
          {formatCurrency(statistic.overview.totalExpense)}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Nạp quỹ</p>
        <p className="mt-1 text-lg font-semibold text-slate-950">
          {formatCurrency(statistic.overview.totalIncome)}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Thành viên</p>
        <p className="mt-1 text-lg font-semibold text-slate-950">{statistic.overview.memberCount}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Khoản chi</p>
        <p className="mt-1 text-lg font-semibold text-slate-950">{statistic.overview.expenseCount}</p>
      </div>
    </Card>
  );
}

// "Cân đối thành viên" thu gọn cho Overview — chỉ trả lời "tiền đang cân bằng
// giữa các thành viên thế nào?", không lặp lại breakdown chi tiết per-member
// đã có ở Statistics (MemberBalanceTable). Giữ tên "Cân đối thành viên" (khớp
// terminology với Statistics) dù nội dung thiên về settlement state — CTA
// "Xem đối soát →" đã đảm nhiệm phần action, mở SettlementWorkspace (dialog
// compact riêng, KHÔNG phải "Thống kê tài chính" đầy đủ — xem page.tsx).
// Dùng chung computeSettlementProgress/SettlementProgressSummary với
// SettlementWorkspace để 2 nơi luôn nhất quán.
function TravelMemberBalanceOverviewCard({
  completedSettlementsCount,
  onOpenSettlements,
  requiresFundAllocation,
  statistic,
  suggestions,
}: {
  completedSettlementsCount: OverviewRendererProps['completedSettlementsCount'];
  onOpenSettlements: OverviewRendererProps['onOpenSettlements'];
  requiresFundAllocation: OverviewRendererProps['requiresFundAllocation'];
  statistic: OverviewRendererProps['statistic'];
  suggestions: OverviewRendererProps['suggestions'];
}) {
  const progress = computeSettlementProgress(
    statistic.memberBalances,
    suggestions,
    statistic.overview,
    requiresFundAllocation,
    completedSettlementsCount,
  );

  return (
    <Card className="gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Cân đối thành viên</h3>
      <SettlementProgressSummary progress={progress} />
      <button
        className="self-end text-sm font-medium text-[var(--color-primary)] transition hover:text-[color:color-mix(in_srgb,var(--color-primary)_78%,black)]"
        onClick={onOpenSettlements}
        type="button"
      >
        Xem đối soát ➔
      </button>
    </Card>
  );
}

// Top 3 danh mục chi nhiều nhất — trả lời "tiền chủ yếu chi vào đâu?" mà
// không lặp lại toàn bộ donut/legend đầy đủ đã có ở Statistics.
function TravelCategoryOverviewCard({ statistic }: { statistic: OverviewRendererProps['statistic'] }) {
  const rows = statistic.categoryBreakdown.filter((row) => row.totalAmount > 0);
  const total = rows.reduce((sum, row) => sum + row.totalAmount, 0);
  const topRows = rows.slice(0, 3);
  const restCount = rows.length - topRows.length;
  const restAmount = rows.slice(3).reduce((sum, row) => sum + row.totalAmount, 0);

  return (
    <Card className="gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Chi tiêu theo danh mục</h3>
      {topRows.length === 0 ? (
        <p className="text-sm text-slate-600">Chưa có khoản chi nào để phân tích.</p>
      ) : (
        <div className="space-y-3">
          {topRows.map((row) => {
            const Icon = row.icon ? getCategoryIcon(row.icon) : null;
            const percent = total > 0 ? Math.round((row.totalAmount / total) * 100) : 0;
            const color = resolveCategoryColor(row.iconColor);

            return (
              <div key={row.categoryId ?? row.categoryName}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-slate-700">
                    {Icon ? (
                      <span
                        className={cn(
                          'flex size-6 shrink-0 items-center justify-center rounded-full',
                          row.iconBgColor,
                        )}
                      >
                        <Icon className={cn('size-3.5', row.iconColor)} />
                      </span>
                    ) : null}
                    <span className="truncate">{row.categoryName}</span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap font-medium text-slate-900">
                    {formatCompactCurrency(row.totalAmount)} · {percent}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color, width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
          {restCount > 0 ? (
            <p className="text-xs text-slate-500">
              + {restCount} danh mục khác · {formatCompactCurrency(restAmount)}
            </p>
          ) : null}
        </div>
      )}
    </Card>
  );
}

// "Tài chính" cho Travel — thay financeSummary chung: giữ KPI row nhưng đổi
// "Tổng thu" → "Nạp quỹ", và promote 2 insight quan trọng nhất với Travel
// (Cân đối thành viên, Chi tiêu theo danh mục) lên Overview thay vì chỉ có
// 4 con số đơn lẻ. Cố tình KHÔNG bê nguyên MemberBalanceTable/
// FinanceCategoryDonut từ Statistics sang — Overview chỉ đóng vai trò
// snapshot, Statistics vẫn là nơi giải thích chi tiết.
function TravelFinanceSummaryWidget({
  completedSettlementsCount,
  isPlanEnded,
  onOpenSettlements,
  onOpenStatistics,
  onSelectMilestoneDrilldown,
  requiresFundAllocation,
  statistic,
  suggestions,
}: OverviewRendererProps) {
  return (
    <div className="space-y-3">
      <SectionHeading
        action={
          <button
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] transition hover:text-[color:color-mix(in_srgb,var(--color-primary)_78%,black)]"
            onClick={onOpenStatistics}
            type="button"
          >
            Mở thống kê <ArrowRight className="size-4" />
          </button>
        }
        eyebrow="Tài chính"
        title="Thu chi kế hoạch"
      />
      {isPlanEnded ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <CategoryBreakdown statistic={statistic} />
          <MilestoneBreakdown
            onSelectMilestoneMember={onSelectMilestoneDrilldown}
            statistic={statistic}
          />
        </div>
      ) : (
        <>
          <TravelFinanceKpiRow statistic={statistic} />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <TravelMemberBalanceOverviewCard
              completedSettlementsCount={completedSettlementsCount}
              onOpenSettlements={onOpenSettlements}
              requiresFundAllocation={requiresFundAllocation}
              statistic={statistic}
              suggestions={suggestions}
            />
            <TravelCategoryOverviewCard statistic={statistic} />
          </div>
        </>
      )}
    </div>
  );
}

function MemberSummaryWidget({ members }: OverviewRendererProps) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
        Thành viên
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">
        {members.length}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Tổng số người đang tham gia hoặc được gắn với kế hoạch.
      </p>
    </Card>
  );
}

function TravelItinerarySummaryWidget({
  isTravelActivitiesLoading,
  onOpenTravelItinerary,
  travelActivities,
  travelActivityError,
}: OverviewRendererProps) {
  const nextActivity = resolveUpcomingActivity(travelActivities);
  const categoryMeta = nextActivity
    ? getTravelActivityCategoryMeta(nextActivity.category)
    : null;

  return (
    <div className="space-y-3">
      <SectionHeading
        action={
          onOpenTravelItinerary ? (
            <button
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] transition hover:text-[color:color-mix(in_srgb,var(--color-primary)_78%,black)]"
              onClick={onOpenTravelItinerary}
              type="button"
            >
              Mở lịch trình <ArrowRight className="size-4" />
            </button>
          ) : null
        }
        eyebrow="Lịch trình"
        title="Điểm dừng tiếp theo"
        description="Overview nên cho thấy việc gì sắp diễn ra tiếp theo trong chuyến đi."
      />
      <Card>
        {travelActivityError ? (
          <p className="text-sm text-rose-600">{travelActivityError}</p>
        ) : isTravelActivitiesLoading ? (
          <Skeleton className="h-28 rounded-2xl" />
        ) : nextActivity ? (
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
            <div>
              <div className="flex items-center gap-2">
                {categoryMeta ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    <categoryMeta.icon className="size-3.5" />
                    {categoryMeta.label}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-xl font-semibold text-slate-950">
                {nextActivity.title}
              </p>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <Clock3 className="size-4 text-sky-700" />
                  {formatDateTime(nextActivity.startsAt.toDate())}
                </p>
                {nextActivity.locationName ? (
                  <p className="flex items-center gap-2">
                    <MapPinned className="size-4 text-sky-700" />
                    {nextActivity.locationName}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Tổng lịch trình
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                {travelActivities.length}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                hoạt động đã được ghi nhận cho chuyến đi.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-slate-200 px-4 py-5 text-sm leading-6 text-slate-600">
            Chưa có hoạt động nào trong lịch trình. Bạn có thể thêm hoạt động đầu tiên ở tab Lịch trình.
          </div>
        )}
      </Card>
    </div>
  );
}

// Chỉ còn phục vụ legacy (finance_aggregate) — native_debt dùng DebtOverviewSummaryWidget
// riêng (docs/debt-plan-specs.md #26: hai engine tách biệt).
function DebtSummaryWidget(props: OverviewRendererProps) {
  const {
    debtTrackingError,
    debtTrackingSummary,
    isDebtTrackingLoading,
    onOpenDebtTracking,
  } = props;

  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(23,32,51,0.08)]">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
        Khoản vay
      </p>
      {debtTrackingError ? (
        <p className="mt-2 text-sm text-rose-600">{debtTrackingError}</p>
      ) : isDebtTrackingLoading ? (
        <Skeleton className="mt-3 h-20 rounded-2xl" />
      ) : (
        <>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {formatCompactCurrency(debtTrackingSummary.outstandingAmount)}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {debtTrackingSummary.activeCounterpartCount} thành viên còn dư nợ,{' '}
            {debtTrackingSummary.settledCounterpartCount} thành viên đã cân bằng
          </p>
          <button
            className="mt-3 text-sm font-medium text-[var(--color-primary)] transition hover:text-[color:color-mix(in_srgb,var(--color-primary)_78%,black)]"
            onClick={onOpenDebtTracking}
            type="button"
          >
            Mở theo dõi khoản vay
          </button>
        </>
      )}
    </Card>
  );
}

const DEBT_ATTENTION_MAX_LINES = 5;
const DEBT_RECENT_ACTIVITY_MAX_LINES = 5;

function resolveCounterpartyName(
  members: OverviewRendererProps['members'],
  counterpartyMemberId: string,
): string {
  return (
    members.find((member) => member.id === counterpartyMemberId)?.nickname ??
    'Chưa rõ đối tượng'
  );
}

// "Công nợ hiện tại": chỉ đếm SỐ NGƯỜI theo từng chiều, không lặp lại số tiền đã có ở
// Plan Header phía trên — mỗi vùng UI trả lời một câu hỏi riêng (xem brainstorm trong
// hội thoại). Không hiển thị Net balance/Chênh lệch ròng ở đây.
function DebtStatusOverviewCard({
  nativeDebtCounterpartyLedgers,
}: Pick<OverviewRendererProps, 'nativeDebtCounterpartyLedgers'>) {
  const receivableCount = nativeDebtCounterpartyLedgers.filter(
    (ledger) => ledger.receivableOutstanding > 0,
  ).length;
  const payableCount = nativeDebtCounterpartyLedgers.filter(
    (ledger) => ledger.payableOutstanding > 0,
  ).length;

  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(23,32,51,0.08)]">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
        Công nợ hiện tại
      </p>
      <div className="mt-2 space-y-2">
        <div className="flex items-center gap-2">
          <ArrowUp className="size-4 shrink-0 text-[color:var(--color-income)]" />
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-slate-950">
              {receivableCount}
            </span>{' '}
            người đang nợ bạn
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ArrowDown className="size-4 shrink-0 text-[color:var(--color-expense)]" />
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-slate-950">{payableCount}</span>{' '}
            người bạn đang nợ
          </p>
        </div>
      </div>
    </Card>
  );
}

// "Cần chú ý": chỉ render khi thực sự có loan quá hạn/sắp đến hạn — không tạo placeholder
// giả để lấp UI. Amount là outstanding của cả ledger (direction đó), không phải amount
// riêng của 1 loan cụ thể (docs/debt-plan-specs.md #21/#22 — repayment không allocate vào
// loan cụ thể nên không được khẳng định 1 loan còn lại bao nhiêu).
function DebtAttentionCard({
  members,
  nativeDebtCounterpartyLedgers,
  nativeDebtTransactions,
}: Pick<
  OverviewRendererProps,
  'members' | 'nativeDebtCounterpartyLedgers' | 'nativeDebtTransactions'
>) {
  const items = calculateDebtAttentionItems(
    nativeDebtTransactions,
    nativeDebtCounterpartyLedgers,
    new Date(),
  );

  if (items.length === 0) {
    return null;
  }

  const visibleItems = items.slice(0, DEBT_ATTENTION_MAX_LINES);
  const hiddenCount = items.length - visibleItems.length;

  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(23,32,51,0.08)]">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
        Cần chú ý
      </p>
      <div className="mt-2 space-y-3">
        {visibleItems.map((item) => (
          <div
            className="flex items-start justify-between gap-3"
            key={`${item.counterpartyMemberId}:${item.direction}`}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {resolveCounterpartyName(members, item.counterpartyMemberId)}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-[color:var(--color-warning)]">
                <AlertTriangle className="size-3.5 shrink-0" />
                {item.isOverdue ? 'Quá hạn' : 'Đến hạn'}{' '}
                {formatDate(item.earliestDueDate.toDate())}
              </p>
            </div>
            <p
              className={cn(
                'shrink-0 text-sm font-semibold',
                item.direction === 'receivable'
                  ? 'text-[color:var(--color-income)]'
                  : 'text-[color:var(--color-expense)]',
              )}
            >
              {item.direction === 'receivable' ? 'Cần thu ' : 'Cần trả '}
              {formatCompactCurrency(item.outstanding)}
            </p>
          </div>
        ))}
      </div>
      {hiddenCount > 0 ? (
        <p className="text-xs text-slate-400">+{hiddenCount} khoản khác</p>
      ) : null}
    </Card>
  );
}

// "Hoạt động gần đây": tối đa DEBT_RECENT_ACTIVITY_MAX_LINES giao dịch mới nhất toàn plan
// (không phải theo 1 người) — không đưa toàn bộ lịch sử vào Overview, xem chi tiết đầy đủ
// nằm ở tab Khoản vay (onOpenDebtTracking).
function DebtRecentActivityCard({
  members,
  nativeDebtTransactions,
  onOpenDebtTracking,
}: Pick<
  OverviewRendererProps,
  'members' | 'nativeDebtTransactions' | 'onOpenDebtTracking'
>) {
  const recentTransactions = nativeDebtTransactions.slice(
    0,
    DEBT_RECENT_ACTIVITY_MAX_LINES,
  );

  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(23,32,51,0.08)]">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
        Hoạt động gần đây
      </p>
      {recentTransactions.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          Chưa có giao dịch nào được ghi nhận.
        </p>
      ) : (
        <div className="mt-2 space-y-3">
          {recentTransactions.map((transaction) => {
            const isCashIn = isDebtTransactionCashIn(transaction);
            const categoryLabel =
              transaction.type === 'loan'
                ? getDebtTransactionCategoryLabel(transaction.category)
                : 'Trả nợ';
            const occurredAt =
              timestampToDate(transaction.occurredAt) ?? new Date();

            return (
              <div
                className="flex items-start justify-between gap-3"
                key={transaction.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {resolveCounterpartyName(
                      members,
                      transaction.counterpartyMemberId,
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {categoryLabel} · {formatDate(occurredAt)}
                  </p>
                </div>
                <p
                  className={cn(
                    'shrink-0 text-sm font-semibold',
                    isCashIn
                      ? 'text-[color:var(--color-income)]'
                      : 'text-[color:var(--color-expense)]',
                  )}
                >
                  {isCashIn ? '+' : '-'}
                  {formatCompactCurrency(transaction.amount)}
                </p>
              </div>
            );
          })}
        </div>
      )}
      <button
        className="text-sm font-medium text-[var(--color-primary)] transition hover:text-[color:color-mix(in_srgb,var(--color-primary)_78%,black)]"
        onClick={onOpenDebtTracking}
        type="button"
      >
        Xem tất cả →
      </button>
    </Card>
  );
}

// Widget "Tổng quan" riêng cho native_debt — thay thế planSummary + debtSummary (2 widget
// đó không phù hợp/không đủ cho debt plan). Mỗi card trả lời đúng 1 câu hỏi, không lặp lại
// số tiền đã có ở Plan Header (Phải thu/Phải trả) hay member count.
function DebtOverviewSummaryWidget(props: OverviewRendererProps) {
  const {
    members,
    nativeDebtCounterpartyLedgers,
    nativeDebtError,
    nativeDebtTransactions,
    isNativeDebtLoading,
    onOpenDebtTracking,
  } = props;

  if (nativeDebtError) {
    return (
      <Card>
        <p className="text-sm text-rose-600">{nativeDebtError}</p>
      </Card>
    );
  }

  if (isNativeDebtLoading) {
    return <Skeleton className="h-52 rounded-[28px]" />;
  }

  return (
    <>
      <DebtStatusOverviewCard
        nativeDebtCounterpartyLedgers={nativeDebtCounterpartyLedgers}
      />
      <DebtAttentionCard
        members={members}
        nativeDebtCounterpartyLedgers={nativeDebtCounterpartyLedgers}
        nativeDebtTransactions={nativeDebtTransactions}
      />
      <DebtRecentActivityCard
        members={members}
        nativeDebtTransactions={nativeDebtTransactions}
        onOpenDebtTracking={onOpenDebtTracking}
      />
    </>
  );
}

export const overviewWidgetRegistry: Partial<
  Record<OverviewWidgetId, OverviewWidgetRendererDefinition>
> = {
  planSummary: {
    id: 'planSummary',
    moduleId: 'overview',
    component: PlanSummaryWidget,
    isAvailable: () => true,
  },
  planningSnapshot: {
    id: 'planningSnapshot',
    moduleId: 'planning',
    component: PlanningSnapshotWidget,
    isAvailable: (props) => !props.isPlanEnded,
  },
  financeSummary: {
    id: 'financeSummary',
    moduleId: 'finance',
    component: FinanceSummaryWidget,
    isAvailable: () => true,
  },
  travelFinanceSummary: {
    id: 'travelFinanceSummary',
    moduleId: 'finance',
    component: TravelFinanceSummaryWidget,
    isAvailable: () => true,
  },
  memberSummary: {
    id: 'memberSummary',
    moduleId: 'members',
    component: MemberSummaryWidget,
    isAvailable: () => true,
  },
  travelTripStatus: {
    id: 'travelTripStatus',
    moduleId: 'overview',
    component: TravelTripStatusWidget,
    isAvailable: () => true,
  },
  travelPlanningProgress: {
    id: 'travelPlanningProgress',
    moduleId: 'planning',
    component: TravelPlanningProgressWidget,
    isAvailable: (props) => !props.isPlanEnded,
  },
  travelAttentionTodos: {
    id: 'travelAttentionTodos',
    moduleId: 'planning',
    component: TravelAttentionTodosWidget,
    isAvailable: (props) => !props.isPlanEnded,
  },
  travelItinerarySummary: {
    id: 'travelItinerarySummary',
    moduleId: 'travelItinerary',
    component: TravelItinerarySummaryWidget,
    isAvailable: (props) => props.isTravelItineraryEnabled,
  },
  debtSummary: {
    id: 'debtSummary',
    moduleId: 'debtTracking',
    component: DebtSummaryWidget,
    isAvailable: (props) =>
      props.isDebtTrackingEnabled &&
      resolvePlanDebtModel(props.plan) !== 'native_debt',
  },
  debtOverviewSummary: {
    id: 'debtOverviewSummary',
    moduleId: 'debtTracking',
    component: DebtOverviewSummaryWidget,
    isAvailable: (props) =>
      props.isDebtTrackingEnabled &&
      resolvePlanDebtModel(props.plan) === 'native_debt',
  },
  ...weddingOverviewWidgetRegistry,
};
