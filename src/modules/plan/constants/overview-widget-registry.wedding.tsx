'use client';

import { useMemo } from 'react';

import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { TodoList } from '@/modules/todo';
import { getMilestoneAnchorDate, milestoneStatusLabel } from '@/modules/milestone/utils/milestone-status';
import { useGuestInvitations } from '@/modules/wedding-guest/hooks/use-guest-invitations';
import { calculateOverallGuestStatistic } from '@/modules/wedding-guest/utils/wedding-guest-statistic';
import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatCompactCurrency } from '@/shared/utils/currency';
import { formatDueCountdown, getDueUrgency } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import { cn } from '@/shared/utils/cn';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import type { OverviewWidgetId } from '@/modules/plan/types/plan-modular';
import type { OverviewRendererProps } from '@/modules/plan/components/overview-renderer';
import type { OverviewWidgetRendererDefinition } from '@/modules/plan/constants/overview-widget-registry';

const ATTENTION_MAX_ITEMS = 3;

function ViewAllAction({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="text-sm font-medium text-[var(--color-primary)] transition hover:text-[color:color-mix(in_srgb,var(--color-primary)_78%,black)]"
      onClick={onClick}
      type="button"
    >
      Xem tất cả →
    </button>
  );
}

// "Cần chú ý": thay hoàn toàn planSummary (4-KPI) cho wedding — không lặp lại status/member
// count đã có ở Header, chỉ trả lời "có việc gì cần xử lý ngay không".
function WeddingAttentionSummaryWidget({
  isTodosLoading,
  onOpenPlanningTodos,
  todos,
  todoActionError,
  visibleMilestones,
}: OverviewRendererProps) {
  const milestoneTitleById = useMemo(
    () => new Map(visibleMilestones.map((milestone) => [milestone.id, milestone.title])),
    [visibleMilestones],
  );

  const attentionItems = useMemo(() => {
    return todos
      .filter((todo) => todo.status !== 'done' && todo.status !== 'cancelled' && todo.dueDate)
      .map((todo) => {
        const dueDate = timestampToDate(todo.dueDate) as Date;

        return { todo, dueDate, urgency: getDueUrgency(dueDate) };
      })
      .filter((item) => item.urgency !== 'normal')
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [todos]);

  const overdueCount = attentionItems.filter((item) => item.urgency === 'overdue').length;
  const dueTodayCount = attentionItems.filter((item) => item.urgency === 'danger').length;
  const dueSoonCount = attentionItems.filter((item) => item.urgency === 'warning').length;

  return (
    <Card className="gap-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Cần chú ý</p>
      {todoActionError ? <AuthFormMessage message={todoActionError} type="error" /> : null}
      {isTodosLoading ? (
        <Skeleton className="h-24 rounded-2xl" />
      ) : attentionItems.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <CheckCircle2 className="size-4 shrink-0 text-[color:var(--color-success)]" />
          Không có việc quá hạn hoặc sắp đến hạn.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            {overdueCount > 0 ? (
              <span className="flex items-center gap-1.5 font-medium text-[color:var(--color-danger)]">
                <AlertTriangle className="size-3.5 shrink-0" />
                {overdueCount} việc quá hạn
              </span>
            ) : null}
            {dueTodayCount > 0 ? (
              <span className="flex items-center gap-1.5 font-medium text-[color:var(--color-warning)]">
                <Clock3 className="size-3.5 shrink-0" />
                {dueTodayCount} việc đến hạn hôm nay
              </span>
            ) : null}
            {dueSoonCount > 0 ? (
              <span className="flex items-center gap-1.5 text-slate-500">{dueSoonCount} việc sắp đến hạn</span>
            ) : null}
          </div>
          <div className="space-y-2">
            {attentionItems.slice(0, ATTENTION_MAX_ITEMS).map((item) => (
              <div className="flex items-start justify-between gap-3" key={item.todo.id}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{item.todo.title}</p>
                  <p className="truncate text-xs text-slate-500">
                    {milestoneTitleById.get(item.todo.milestoneId) ?? 'Không có mốc'}
                  </p>
                </div>
                <p
                  className={cn(
                    'shrink-0 text-xs font-semibold',
                    item.urgency === 'overdue'
                      ? 'text-[color:var(--color-danger)]'
                      : item.urgency === 'danger'
                        ? 'text-[color:var(--color-warning)]'
                        : 'text-slate-500',
                  )}
                >
                  {formatDueCountdown(item.dueDate)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
      <ViewAllAction onClick={onOpenPlanningTodos} />
    </Card>
  );
}

function WeddingMilestoneCard({
  estimatedByMilestoneId,
  milestone,
}: {
  estimatedByMilestoneId: Record<string, number>;
  milestone: MilestoneDocument;
}) {
  const estimatedTotal = estimatedByMilestoneId[milestone.id] ?? 0;
  const progress = milestone.todoCount > 0 ? Math.round((milestone.completedTodoCount / milestone.todoCount) * 100) : 0;
  const anchorDate = getMilestoneAnchorDate(milestone);
  const dayDiff = anchorDate ? Math.ceil((anchorDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)) : null;

  const statusLabel =
    milestone.status === 'in_progress'
      ? 'Đang diễn ra'
      : milestone.status === 'upcoming' && dayDiff !== null && dayDiff > 0
        ? `Còn ${dayDiff} ngày`
        : milestoneStatusLabel[milestone.status];

  return (
    <Card className="gap-3">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-semibold text-slate-950">{milestone.title}</p>
        <Badge variant={milestone.status === 'in_progress' ? 'warning' : 'info'}>{statusLabel}</Badge>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Công việc</span>
          <span className="font-medium text-slate-700">
            {milestone.completedTodoCount}/{milestone.todoCount}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[var(--color-primary)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Đã chi</p>
          <p className="mt-1 font-medium text-slate-950">{formatCompactCurrency(milestone.totalExpense)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Dự kiến</p>
          <p className="mt-1 font-medium text-slate-600">{formatCompactCurrency(estimatedTotal)}</p>
        </div>
      </div>
    </Card>
  );
}

// "Mốc kế hoạch": tách từ planningSnapshot chung — chỉ đổi hierarchy hiển thị (thời gian →
// tiến độ → tiền) và vị trí CTA cho wedding, không đụng MilestoneList/MilestoneCard dùng ở
// tab Công việc cho mọi plan type.
function WeddingMilestoneSnapshotWidget({
  estimatedByMilestoneId,
  isMilestonesLoading,
  milestoneActionError,
  onOpenPlanningMilestones,
  upcomingMilestones,
}: OverviewRendererProps) {
  return (
    <div className="space-y-3">
      <SectionHeading
        action={<ViewAllAction onClick={onOpenPlanningMilestones} />}
        eyebrow="Mốc kế hoạch"
        title="Mốc sắp tới"
      />
      {milestoneActionError ? <AuthFormMessage message={milestoneActionError} type="error" /> : null}
      {isMilestonesLoading ? (
        <Skeleton className="h-32 rounded-[28px]" />
      ) : upcomingMilestones.length === 0 ? (
        <Card className="border-slate-200 bg-slate-50 shadow-none">
          <p className="text-sm leading-6 text-slate-600">Không có mốc nào đang diễn ra hoặc sắp diễn ra.</p>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-3">
          {upcomingMilestones.map((milestone) => (
            <WeddingMilestoneCard
              estimatedByMilestoneId={estimatedByMilestoneId}
              key={milestone.id}
              milestone={milestone}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// "Công việc sắp đến hạn": tái dùng nguyên TodoList/TodoCard (đã đủ tốt theo đánh giá),
// chỉ đổi vị trí CTA vào SectionHeading thay vì hàng nút riêng.
function WeddingTodoSnapshotWidget({
  canManagePlanning,
  isTodoSubmitting,
  isTodosLoading,
  members,
  onAddVendor,
  onDeleteTodo,
  onOpenPlanningTodo,
  onOpenPlanningTodos,
  onToggleTodoStatus,
  todoActionError,
  upcomingTodos,
  visibleMilestones,
}: OverviewRendererProps) {
  return (
    <div className="space-y-3">
      <SectionHeading
        action={<ViewAllAction onClick={onOpenPlanningTodos} />}
        description="5 việc chưa hoàn thành"
        eyebrow="Công việc"
        title="Việc sắp đến hạn"
      />
      {todoActionError ? <AuthFormMessage message={todoActionError} type="error" /> : null}
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
  );
}

const RSVP_LABEL: Record<'attending' | 'pending' | 'not_attending', string> = {
  attending: 'Đã xác nhận',
  pending: 'Chờ phản hồi',
  not_attending: 'Không tham dự',
};

// "Khách mời": lấp widget weddingGuestSummary đang bị thiếu component — RSVP breakdown +
// % xác nhận, không đưa tiền/vàng mừng lên Overview (chỉ có ở tab Khách mời).
function WeddingGuestSummaryWidget({ onOpenWeddingGuests, planId }: OverviewRendererProps) {
  const { errorMessage, invitations, isLoading } = useGuestInvitations(planId);
  const statistic = useMemo(() => calculateOverallGuestStatistic(invitations), [invitations]);
  const { rsvpBreakdown } = statistic;
  const total = rsvpBreakdown.attending + rsvpBreakdown.pending + rsvpBreakdown.not_attending;
  const confirmedPercent = total > 0 ? Math.round((rsvpBreakdown.attending / total) * 100) : 0;

  return (
    <Card className="gap-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Khách mời</p>
      {errorMessage ? (
        <p className="text-sm text-[color:var(--color-danger)]">{errorMessage}</p>
      ) : isLoading ? (
        <Skeleton className="h-24 rounded-2xl" />
      ) : total === 0 ? (
        <p className="text-sm text-slate-600">Chưa có khách mời nào được thêm vào kế hoạch.</p>
      ) : (
        <>
          <p className="text-2xl font-semibold text-slate-950">{total} khách mời</p>
          <div className="space-y-1.5 text-sm text-slate-600">
            {(['attending', 'pending', 'not_attending'] as const).map((status) => (
              <div className="flex items-center justify-between" key={status}>
                <span>{RSVP_LABEL[status]}</span>
                <span className="font-medium text-slate-900">{rsvpBreakdown[status]}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[var(--color-primary)]"
                style={{ width: `${confirmedPercent}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">{confirmedPercent}% đã xác nhận</p>
          </div>
        </>
      )}
      <ViewAllAction onClick={onOpenWeddingGuests} />
    </Card>
  );
}

// "Tài chính": thay financeSummary cho wedding — chỉ hiện đã chi/dự kiến (ratio, insight
// mới so với Header) + top category, không lặp status/member/income như card cũ.
function WeddingFinanceSummaryWidget({
  estimatedTotal,
  onOpenFinance,
  statistic,
}: OverviewRendererProps) {
  const spent = statistic.overview.totalExpense;
  const usedPercent = estimatedTotal > 0 ? Math.round((spent / estimatedTotal) * 100) : 0;
  const topCategories = [...statistic.categoryBreakdown]
    .filter((category) => category.totalAmount > 0)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 3);

  return (
    <Card className="gap-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Tài chính</p>
      <div className="space-y-1.5">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-950">{formatCompactCurrency(spent)}</span>
          {' / '}
          {formatCompactCurrency(estimatedTotal)}
        </p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[var(--color-primary)]"
            style={{ width: `${Math.min(usedPercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-500">{usedPercent}% dự kiến đã sử dụng</p>
      </div>
      {topCategories.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Chi nhiều nhất</p>
          {topCategories.map((category) => (
            <div className="flex items-center justify-between text-sm" key={category.categoryId ?? category.categoryName}>
              <span className="text-slate-600">{category.categoryName}</span>
              <span className="font-medium text-slate-900">{formatCompactCurrency(category.totalAmount)}</span>
            </div>
          ))}
        </div>
      ) : null}
      <ViewAllAction onClick={onOpenFinance} />
    </Card>
  );
}

// isAvailable ở đây chỉ xét điều kiện BỔ SUNG (ví dụ plan đã kết thúc chưa) — việc lọc
// theo plan type đã được đảm bảo từ trước bởi plan-type-config.ts (các widget này chỉ
// được khai báo trong overview.widgets của wedding), giống cách planSummary/memberSummary
// dùng `isAvailable: () => true` vì đã được config lọc theo plan type từ trước.
export const weddingOverviewWidgetRegistry: Partial<
  Record<OverviewWidgetId, OverviewWidgetRendererDefinition>
> = {
  weddingAttentionSummary: {
    id: 'weddingAttentionSummary',
    moduleId: 'overview',
    component: WeddingAttentionSummaryWidget,
    isAvailable: () => true,
  },
  weddingMilestoneSnapshot: {
    id: 'weddingMilestoneSnapshot',
    moduleId: 'planning',
    component: WeddingMilestoneSnapshotWidget,
    isAvailable: (props) => !props.isPlanEnded,
  },
  weddingTodoSnapshot: {
    id: 'weddingTodoSnapshot',
    moduleId: 'planning',
    component: WeddingTodoSnapshotWidget,
    isAvailable: (props) => !props.isPlanEnded,
  },
  weddingGuestSummary: {
    id: 'weddingGuestSummary',
    moduleId: 'weddingGuests',
    component: WeddingGuestSummaryWidget,
    isAvailable: () => true,
  },
  weddingFinanceSummary: {
    id: 'weddingFinanceSummary',
    moduleId: 'finance',
    component: WeddingFinanceSummaryWidget,
    isAvailable: () => true,
  },
};
