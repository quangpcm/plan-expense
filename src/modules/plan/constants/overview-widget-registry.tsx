'use client';

import { AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { MilestoneList } from '@/modules/milestone';
import { CategoryBreakdown } from '@/modules/statistic/components/category-breakdown';
import { MilestoneBreakdown } from '@/modules/statistic/components/milestone-breakdown';
import { StatisticOverview } from '@/modules/statistic/components/statistic-overview';
import { TodoList } from '@/modules/todo';
import {
  calculateDebtAttentionItems,
  isDebtTransactionCashIn,
} from '@/modules/debt-tracking/calculators/debt-calculators';
import { getDebtTransactionCategoryLabel } from '@/modules/debt-tracking/constants/debt-transaction-category';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatDate } from '@/shared/utils/date';
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

type OverviewWidgetComponent = (
  props: OverviewRendererProps,
) => React.JSX.Element;

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
