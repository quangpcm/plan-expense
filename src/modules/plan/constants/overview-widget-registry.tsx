'use client';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { MilestoneList } from '@/modules/milestone';
import { CategoryBreakdown } from '@/modules/statistic/components/category-breakdown';
import { MilestoneBreakdown } from '@/modules/statistic/components/milestone-breakdown';
import { StatisticOverview } from '@/modules/statistic/components/statistic-overview';
import { TodoList } from '@/modules/todo';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatDate } from '@/shared/utils/date';
import { formatCompactCurrency, formatCurrency } from '@/shared/utils/currency';
import type { OverviewWidgetDefinition, OverviewWidgetId } from '@/modules/plan/types/plan-modular';
import type { OverviewRendererProps } from '@/modules/plan/components/overview-renderer';
import { resolvePlanDebtModel } from '@/modules/plan/utils/plan-type-config';

type OverviewWidgetComponent = (props: OverviewRendererProps) => React.JSX.Element;

export type OverviewWidgetRendererDefinition = OverviewWidgetDefinition & {
  component: OverviewWidgetComponent;
  isAvailable: (props: OverviewRendererProps) => boolean;
};

function PlanSummaryWidget({
  endedPlanDate,
  isPlanEnded,
  members,
  planStatus,
  statistic,
}: OverviewRendererProps) {
  const endedAtLabel = endedPlanDate ? formatDate(endedPlanDate) : 'Đã kết thúc';

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
  canManagePlanning,
  estimatedByMilestoneId,
  isMilestonesLoading,
  isTodoSubmitting,
  isTodosLoading,
  members,
  milestoneActionError,
  onAddVendor,
  onDeleteTodo,
  onOpenPlanningMilestones,
  onOpenPlanningTodo,
  onOpenPlanningTodos,
  onSelectUpcomingMilestone,
  onToggleTodoStatus,
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
            canManagePlan={canManagePlanning}
            className="sm:grid-cols-2 lg:grid-cols-3"
            emptyMessage="Không có công việc nào sắp đến hạn."
            isSubmitting={isTodoSubmitting}
            members={members}
            milestones={visibleMilestones}
            preserveOrder
            onAddVendor={onAddVendor}
            onChangeStatus={onToggleTodoStatus}
            onDeleteTodo={onDeleteTodo}
            onEdit={onOpenPlanningTodo}
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
  onSelectMilestoneDrilldown,
  statistic,
}: OverviewRendererProps) {
  return (
    <div className="space-y-3">
      <SectionHeading eyebrow="Tài chính" title="Thu chi kế hoạch" />
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
  travelActivities,
  travelActivityError,
}: OverviewRendererProps) {
  const nextActivity = [...travelActivities].sort(
    (left, right) => left.startsAt.toMillis() - right.startsAt.toMillis(),
  )[0];

  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
        Lịch trình
      </p>
      {travelActivityError ? (
        <p className="mt-2 text-sm text-rose-600">{travelActivityError}</p>
      ) : isTravelActivitiesLoading ? (
        <Skeleton className="mt-3 h-20 rounded-2xl" />
      ) : (
        <>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {travelActivities.length}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {nextActivity
              ? `Hoạt động gần nhất ${formatDate(nextActivity.startsAt.toDate())}`
              : 'Chưa có hoạt động nào trong lịch trình'}
          </p>
        </>
      )}
    </Card>
  );
}

function DebtSummaryWidget(props: OverviewRendererProps) {
  const {
    debtTrackingError,
    debtTrackingSummary,
    isDebtTrackingLoading,
    nativeDebtError,
    nativeDebtSummary,
    isNativeDebtLoading,
    onOpenDebtTracking,
    plan,
  } = props;
  const isNativeDebt = resolvePlanDebtModel(plan) === 'native_debt';

  if (isNativeDebt) {
    return (
      <Card className="transition hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(23,32,51,0.08)]">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Khoản nợ</p>
        {nativeDebtError ? (
          <p className="mt-2 text-sm text-rose-600">{nativeDebtError}</p>
        ) : isNativeDebtLoading || !nativeDebtSummary ? (
          <Skeleton className="mt-3 h-20 rounded-2xl" />
        ) : (
          <>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500">Phải thu</p>
                <p className="text-lg font-semibold text-slate-950">
                  {formatCompactCurrency(nativeDebtSummary.totalReceivableOutstanding)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Phải trả</p>
                <p className="text-lg font-semibold text-slate-950">
                  {formatCompactCurrency(nativeDebtSummary.totalPayableOutstanding)}
                </p>
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Chênh lệch ròng {nativeDebtSummary.netPosition >= 0 ? '+' : ''}
              {formatCompactCurrency(nativeDebtSummary.netPosition)} ·{' '}
              {nativeDebtSummary.activeCounterpartyCount} đối tượng đang có công nợ
            </p>
            <button
              className="mt-3 text-sm font-medium text-[var(--color-primary)] transition hover:text-[color:color-mix(in_srgb,var(--color-primary)_78%,black)]"
              onClick={onOpenDebtTracking}
              type="button"
            >
              Mở sổ công nợ
            </button>
          </>
        )}
      </Card>
    );
  }

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
  memberSummary: {
    id: 'memberSummary',
    moduleId: 'members',
    component: MemberSummaryWidget,
    isAvailable: () => true,
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
    isAvailable: (props) => props.isDebtTrackingEnabled,
  },
};
