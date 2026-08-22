'use client';

import { useMemo } from 'react';

import { CheckCircle2, Clock3, FolderOpen, Users, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { TodoList } from '@/modules/todo';
import { getCategoryIcon } from '@/modules/category/utils/category-icon';
import { priorityLabel } from '@/modules/todo/utils/todo-display';
import { getMilestoneAnchorDate, milestoneStatusLabel } from '@/modules/milestone/utils/milestone-status';
import { useGuestInvitations } from '@/modules/wedding-guest/hooks/use-guest-invitations';
import { useWeddingGuestGroups } from '@/modules/wedding-guest/hooks/use-wedding-guest-groups';
import {
  calculateGuestStatisticByGroup,
  calculateOverallGuestStatistic,
} from '@/modules/wedding-guest/utils/wedding-guest-statistic';
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
const TODO_SNAPSHOT_MAX_ITEMS = 3;
const GUEST_GROUP_MAX_ITEMS = 3;

type AttentionUrgency = 'overdue' | 'danger' | 'warning';
type UpcomingTodoItem = { todo: OverviewRendererProps['todos'][number]; dueDate: Date };

// Nguồn dùng chung cho cả "Cần chú ý" và "Công việc sắp đến hạn" — sort ascending theo hạn
// để widget thứ 2 có thể loại các item widget đầu đã hiển thị rồi lấy tiếp phần còn lại,
// tránh lặp nội dung giữa 2 section (xem WeddingTodoSnapshotWidget).
function getUpcomingTodosSortedByDueDate(todos: OverviewRendererProps['todos']): UpcomingTodoItem[] {
  return todos
    .filter((todo) => todo.status !== 'done' && todo.status !== 'cancelled' && todo.dueDate)
    .map((todo) => ({ todo, dueDate: timestampToDate(todo.dueDate) as Date }))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

function selectAttentionItems(todos: OverviewRendererProps['todos']) {
  return getUpcomingTodosSortedByDueDate(todos)
    .map((item) => ({ ...item, urgency: getDueUrgency(item.dueDate) }))
    .filter(
      (item): item is UpcomingTodoItem & { urgency: AttentionUrgency } => item.urgency !== 'normal',
    );
}

function ViewAllAction({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="text-sm font-medium text-[var(--color-primary)] transition hover:text-[color:color-mix(in_srgb,var(--color-primary)_78%,black)]"
      onClick={onClick}
      type="button"
    >
      Xem thêm ➔
    </button>
  );
}

function getMilestoneCountdownLabel(milestone: MilestoneDocument) {
  const anchorDate = getMilestoneAnchorDate(milestone);

  if (!anchorDate) {
    return milestoneStatusLabel[milestone.status];
  }

  const dayDiff = Math.ceil(
    (anchorDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000),
  );

  if (milestone.status === 'in_progress') {
    return 'Đang diễn ra';
  }

  if (milestone.status === 'upcoming' && dayDiff > 0) {
    return `Còn ${dayDiff} ngày`;
  }

  return milestoneStatusLabel[milestone.status];
}

// Màu theo đúng "Việc cần chú ý hôm nay" ở todo-notification-screen.tsx (rose/amber/sky) để
// 2 nơi nhất quán trực quan.
const ATTENTION_TONE: Record<AttentionUrgency, { badgeClass: string; priorityClass: string }> = {
  overdue: {
    badgeClass: 'bg-rose-100 text-rose-700',
    priorityClass: 'text-rose-700',
  },
  danger: {
    badgeClass: 'bg-amber-100 text-amber-700',
    priorityClass: 'text-amber-700',
  },
  warning: {
    badgeClass: 'bg-sky-100 text-sky-700',
    priorityClass: 'text-sky-700',
  },
};

function AttentionItemRow({
  dueDate,
  milestoneTitle,
  onSelect,
  todo,
  urgency,
}: {
  dueDate: Date;
  milestoneTitle: string;
  onSelect: () => void;
  todo: OverviewRendererProps['todos'][number];
  urgency: AttentionUrgency;
}) {
  const tone = ATTENTION_TONE[urgency];

  return (
    <button
      className={cn(
        'block w-full px-4 py-4 text-left transition hover:bg-slate-50',
        'lg:rounded-[26px] lg:border lg:border-slate-200 lg:bg-white lg:shadow-[0_10px_32px_rgba(15,23,42,0.05)]',
        'lg:hover:-translate-y-0.5 lg:hover:border-slate-300 lg:hover:bg-white lg:hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]',
      )}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-950">{todo.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <FolderOpen className="size-3.5 text-slate-400" />
              {milestoneTitle}
            </span>
            <span className="text-slate-300">|</span>
            <span className={cn('font-medium', tone.priorityClass)}>{priorityLabel[todo.priority]}</span>
          </div>
        </div>
        <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold', tone.badgeClass)}>
          {formatDueCountdown(dueDate)}
        </span>
      </div>
    </button>
  );
}

// "Cần chú ý": thay hoàn toàn planSummary (4-KPI) cho wedding — không lặp lại status/member
// count đã có ở Header, chỉ trả lời "có việc gì cần xử lý ngay không". Kiểu item tham khảo
// từ todo-notification-screen.tsx (title, mốc + priority, badge hạn, "Mở chi tiết") nhưng bỏ
// tên plan (chỉ có 1 plan trong context này) và dùng divide-y thay vì card border riêng vì
// đã nằm trong 1 section/Card chung.
function WeddingAttentionSummaryWidget({
  isTodosLoading,
  onOpenPlanningTodos,
  onViewTodo,
  todos,
  todoActionError,
  visibleMilestones,
}: OverviewRendererProps) {
  const milestoneTitleById = useMemo(
    () => new Map(visibleMilestones.map((milestone) => [milestone.id, milestone.title])),
    [visibleMilestones],
  );

  const attentionItems = useMemo(() => selectAttentionItems(todos), [todos]);
  const visibleAttentionItems = attentionItems.slice(0, ATTENTION_MAX_ITEMS);
  const nextTodoItems = useMemo(() => {
    const attentionIds = new Set(visibleAttentionItems.map((item) => item.todo.id));

    return getUpcomingTodosSortedByDueDate(todos)
      .filter((item) => !attentionIds.has(item.todo.id))
      .slice(0, TODO_SNAPSHOT_MAX_ITEMS);
  }, [todos, visibleAttentionItems]);

  const overdueCount = attentionItems.filter((item) => item.urgency === 'overdue').length;
  const dueTodayCount = attentionItems.filter((item) => item.urgency === 'danger').length;
  const dueSoonCount = attentionItems.filter((item) => item.urgency === 'warning').length;
  const summary = [
    overdueCount > 0 ? `${overdueCount} việc quá hạn` : null,
    dueTodayCount > 0 ? `${dueTodayCount} việc đến hạn hôm nay` : null,
    dueSoonCount > 0 ? `${dueSoonCount} việc sắp đến hạn` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="space-y-3">
      <SectionHeading
        action={<ViewAllAction onClick={onOpenPlanningTodos} />}
        eyebrow="Cần chú ý"
        title="Công việc"
        {...(summary ? { description: summary } : {})}
      />
      {todoActionError ? <AuthFormMessage message={todoActionError} type="error" /> : null}
      {isTodosLoading ? (
        <Skeleton className="h-56 rounded-[28px]" />
      ) : (
        <Card className="gap-5">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Cần xử lý ngay
              </p>
              <p className="text-sm text-slate-600">
                {summary || 'Không có việc quá hạn hoặc đến hạn hôm nay.'}
              </p>
            </div>
            {attentionItems.length === 0 ? (
              <div className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                <CheckCircle2 className="size-5 shrink-0 text-[color:var(--color-success)]" />
                <p className="text-sm leading-6 text-slate-600">
                  Mọi việc đang trong tầm kiểm soát.
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  'gap-0 divide-y divide-slate-100 overflow-hidden rounded-[28px] border border-slate-200',
                  'lg:grid lg:gap-3 lg:divide-y-0 lg:overflow-visible lg:rounded-none lg:border-0',
                  visibleAttentionItems.length >= 3
                    ? 'lg:grid-cols-3'
                    : visibleAttentionItems.length === 2
                      ? 'lg:grid-cols-2'
                      : 'lg:grid-cols-1',
                )}
              >
                {visibleAttentionItems.map((item) => (
                  <AttentionItemRow
                    dueDate={item.dueDate}
                    key={item.todo.id}
                    milestoneTitle={milestoneTitleById.get(item.todo.milestoneId) ?? 'Không có mốc'}
                    onSelect={() => onViewTodo(item.todo)}
                    todo={item.todo}
                    urgency={item.urgency}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-1">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Sắp tới</p>
              <p className="text-sm text-slate-600">
                Các công việc tiếp theo trong thời gian tới.
              </p>
            </div>
            {nextTodoItems.length === 0 ? (
              <p className="text-sm leading-6 text-slate-500">
                Không có công việc nào sắp đến hạn.
              </p>
            ) : (
              <div className="space-y-3">
                {nextTodoItems.map((item) => (
                  <button
                    className="flex w-full items-start justify-between gap-4 rounded-[20px] border border-slate-200 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                    key={item.todo.id}
                    onClick={() => onViewTodo(item.todo)}
                    type="button"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {item.todo.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {milestoneTitleById.get(item.todo.milestoneId) ?? 'Không có mốc'}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-slate-500">
                      {formatDueCountdown(item.dueDate)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function WeddingMilestoneCard({
  estimatedByMilestoneId,
  title,
  milestone,
  tone,
}: {
  estimatedByMilestoneId: Record<string, number>;
  milestone: MilestoneDocument;
  title: string;
  tone: 'current' | 'next';
}) {
  const estimatedTotal = estimatedByMilestoneId[milestone.id] ?? 0;
  const progress = milestone.todoCount > 0 ? Math.round((milestone.completedTodoCount / milestone.todoCount) * 100) : 0;
  const statusLabel = getMilestoneCountdownLabel(milestone);

  return (
    <Card className="gap-3">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
              {title}
            </p>
            <p className="mt-1 min-w-0 truncate text-lg font-semibold text-slate-950">
              {milestone.title}
            </p>
          </div>
          <Badge variant={tone === 'current' ? 'warning' : 'info'}>{statusLabel}</Badge>
        </div>
        <p className="text-sm text-slate-600">
          {milestone.completedTodoCount}/{milestone.todoCount} công việc
          {tone === 'current' ? ` · ${progress}%` : ''}
        </p>
      </div>
      {tone === 'current' ? (
        <>
          <div className="space-y-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[var(--color-primary)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-950">
              {formatCompactCurrency(milestone.totalExpense)}
            </span>{' '}
            đã chi · {formatCompactCurrency(estimatedTotal)} dự kiến
          </p>
        </>
      ) : (
        <p className="text-sm text-slate-600">
          {formatCompactCurrency(milestone.totalExpense)} đã chi ·{' '}
          {formatCompactCurrency(estimatedTotal)} dự kiến
        </p>
      )}
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
  visibleMilestones,
}: OverviewRendererProps) {
  const currentMilestone =
    upcomingMilestones.find((milestone) => milestone.status === 'in_progress') ??
    upcomingMilestones[0] ??
    null;
  const nextMilestone = currentMilestone
    ? visibleMilestones.find(
        (milestone) =>
          milestone.id !== currentMilestone.id &&
          milestone.orderIndex > currentMilestone.orderIndex &&
          milestone.status !== 'cancelled',
      ) ?? null
    : upcomingMilestones[1] ?? null;

  return (
    <div className="space-y-3">
      <SectionHeading
        action={<ViewAllAction onClick={onOpenPlanningMilestones} />}
        eyebrow="Kế hoạch"
        title="Tiến độ kế hoạch"
      />
      {milestoneActionError ? <AuthFormMessage message={milestoneActionError} type="error" /> : null}
      {isMilestonesLoading ? (
        <Skeleton className="h-32 rounded-[28px]" />
      ) : !currentMilestone ? (
        <Card className="border-slate-200 bg-slate-50 shadow-none">
          <p className="text-sm leading-6 text-slate-600">Không có mốc nào đang diễn ra hoặc sắp diễn ra.</p>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <WeddingMilestoneCard
            estimatedByMilestoneId={estimatedByMilestoneId}
            milestone={currentMilestone}
            title="Hiện tại"
            tone="current"
          />
          {nextMilestone ? (
            <WeddingMilestoneCard
              estimatedByMilestoneId={estimatedByMilestoneId}
              milestone={nextMilestone}
              title="Tiếp theo"
              tone="next"
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

type RsvpStatus = 'attending' | 'pending' | 'not_attending';

const RSVP_LABEL: Record<RsvpStatus, string> = {
  attending: 'Đã xác nhận',
  pending: 'Chờ phản hồi',
  not_attending: 'Không tham dự',
};

// Màu theo đúng token semantic của app (globals.css: success/warning/muted) — không dùng
// màu tự do — để nhất quán với toàn bộ hệ thống, không riêng widget này.
const RSVP_TONE: Record<RsvpStatus, { barClass: string; colorClass: string; icon: LucideIcon }> = {
  attending: {
    barClass: 'bg-[color:var(--color-success)]',
    colorClass: 'text-[color:var(--color-success)]',
    icon: CheckCircle2,
  },
  pending: {
    barClass: 'bg-[color:var(--color-warning)]',
    colorClass: 'text-[color:var(--color-warning)]',
    icon: Clock3,
  },
  not_attending: {
    barClass: 'bg-[color:var(--color-muted)]',
    colorClass: 'text-[color:var(--color-muted)]',
    icon: XCircle,
  },
};

// "Khách mời": lấp widget weddingGuestSummary đang bị thiếu component — RSVP breakdown +
// % phản hồi + breakdown "Người tham dự" theo Nhóm khách (Đám cưới/Đám hỏi/Báo hỷ...),
// không đưa tiền/vàng mừng lên Overview (chỉ có ở tab Khách mời).
function WeddingGuestSummaryWidget({ onOpenWeddingGuests, planId }: OverviewRendererProps) {
  const {
    errorMessage: invitationsError,
    invitations,
    isLoading: isInvitationsLoading,
  } = useGuestInvitations(planId);
  const { errorMessage: groupsError, groups, isLoading: isGroupsLoading } = useWeddingGuestGroups(planId);
  const isLoading = isInvitationsLoading || isGroupsLoading;
  const errorMessage = invitationsError ?? groupsError;

  const statistic = useMemo(() => calculateOverallGuestStatistic(invitations), [invitations]);
  const { rsvpBreakdown } = statistic;
  const total = rsvpBreakdown.attending + rsvpBreakdown.pending + rsvpBreakdown.not_attending;
  const confirmedPercent = total > 0 ? Math.round((rsvpBreakdown.attending / total) * 100) : 0;
  const pendingGroups = useMemo(
    () =>
      calculateGuestStatisticByGroup(groups, invitations)
        .filter((row) => row.rsvpBreakdown.pending > 0)
        .sort((a, b) => b.rsvpBreakdown.pending - a.rsvpBreakdown.pending),
    [groups, invitations],
  );

  const topGroups = useMemo(
    () =>
      calculateGuestStatisticByGroup(groups, invitations)
        .filter((row) => row.attendeeCount > 0)
        .sort((a, b) => b.attendeeCount - a.attendeeCount)
        .slice(0, GUEST_GROUP_MAX_ITEMS),
    [groups, invitations],
  );

  return (
    <div className="space-y-3">
      <SectionHeading
        action={<ViewAllAction onClick={onOpenWeddingGuests} />}
        description=""
        eyebrow="Khách mời"
        title="Tình hình khách mời"
      />
      <Card className="gap-3">
        {errorMessage ? (
          <p className="text-sm text-[color:var(--color-danger)]">{errorMessage}</p>
        ) : isLoading ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : total === 0 ? (
          <p className="text-sm text-slate-600">Chưa có khách mời nào được thêm vào kế hoạch.</p>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]">
                <Users className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-950">
                  {total} lời mời
                </p>
                <p className="text-sm text-slate-600">
                  {statistic.attendeeCount} người dự kiến
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {(['attending', 'pending', 'not_attending'] as const).map((status) => {
                const tone = RSVP_TONE[status];
                const Icon = tone.icon;

                return (
                  <div className="flex items-center justify-between" key={status}>
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <Icon className={cn('size-4 shrink-0', tone.colorClass)} />
                      {RSVP_LABEL[status]}
                    </span>
                    <span className={cn('font-semibold', tone.colorClass)}>{rsvpBreakdown[status]}</span>
                  </div>
                );
              })}
            </div>
            <div className="space-y-1.5">
              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                {(['attending', 'pending', 'not_attending'] as const).map((status) =>
                  rsvpBreakdown[status] > 0 ? (
                    <div
                      className={cn('h-full', RSVP_TONE[status].barClass)}
                      key={status}
                      style={{ width: `${(rsvpBreakdown[status] / total) * 100}%` }}
                    />
                  ) : null,
                )}
              </div>
              <p className="text-xs font-medium text-[color:var(--color-success)]">{confirmedPercent}% đã phản hồi</p>
            </div>
            {rsvpBreakdown.pending > 0 ? (
              <div className="rounded-2xl border border-[color:var(--color-warning-soft)] bg-[color:var(--color-warning-soft)]/40 px-4 py-3">
                <p className="text-sm font-medium text-[color:var(--color-warning)]">
                  {rsvpBreakdown.pending} lời mời đang chờ phản hồi
                </p>
                {pendingGroups[0] ? (
                  <p className="mt-1 text-xs text-slate-600">
                    Nhiều nhất ở nhóm {pendingGroups[0].group.name}
                  </p>
                ) : null}
              </div>
            ) : null}
            {topGroups.length > 0 ? (
              <div className="space-y-1.5 border-t border-slate-100 pt-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Người tham dự</p>
                {topGroups.map((row) => (
                  <div className="flex items-center justify-between text-sm" key={row.group.id}>
                    <span className="text-slate-600">{row.group.name}</span>
                    <Badge variant="info">{row.attendeeCount} dự kiến</Badge>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}

// Ngưỡng "khoẻ mạnh" của ngân sách — dùng đúng token semantic (success/warning/danger) để
// progress bar trở thành tín hiệu cảnh báo thật, không chỉ trang trí.
function getBudgetHealthTone(usedPercent: number) {
  if (usedPercent > 100) {
    return { barClass: 'bg-[color:var(--color-danger)]', textClass: 'text-[color:var(--color-danger)]' };
  }

  if (usedPercent >= 70) {
    return { barClass: 'bg-[color:var(--color-warning)]', textClass: 'text-[color:var(--color-warning)]' };
  }

  return { barClass: 'bg-[color:var(--color-success)]', textClass: 'text-[color:var(--color-success)]' };
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
  const remainingBudget = Math.max(estimatedTotal - spent, 0);
  const budgetTone = getBudgetHealthTone(usedPercent);
  const topCategories = [...statistic.categoryBreakdown]
    .filter((category) => category.totalAmount > 0)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 3);

  return (
    <div className="space-y-3">
      <SectionHeading
        action={<ViewAllAction onClick={onOpenFinance} />}
        description=""
        eyebrow="Tài chính"
        title="Ngân sách kế hoạch"
      />
      <Card className="gap-3">
        <div className="space-y-1.5">
          <p className="text-sm text-slate-600">
            Đã chi <span className="font-semibold text-slate-950">{formatCompactCurrency(spent)}</span>
            {' / '}
            {formatCompactCurrency(estimatedTotal)}
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn('h-full rounded-full', budgetTone.barClass)}
              style={{ width: `${Math.min(usedPercent, 100)}%` }}
            />
          </div>
          <p className={cn('text-xs font-medium', budgetTone.textClass)}>
            {usedPercent}% ngân sách{usedPercent > 100 ? ' — đã vượt dự kiến' : ''}
          </p>
          <p className="text-sm text-slate-600">
            Còn dự kiến{' '}
            <span className="font-semibold text-slate-950">
              {formatCompactCurrency(remainingBudget)}
            </span>
          </p>
        </div>
        {topCategories.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Chi nhiều nhất</p>
            {topCategories.map((category) => {
              const Icon = getCategoryIcon(category.icon);

              return (
                <div
                  className="flex items-center justify-between text-sm"
                  key={category.categoryId ?? category.categoryName}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full',
                        category.iconBgColor,
                      )}
                    >
                      <Icon className={cn('size-3.5', category.iconColor)} />
                    </span>
                    <span className="truncate text-slate-600">{category.categoryName}</span>
                  </span>
                  <span className="shrink-0 font-medium text-slate-900">
                    {formatCompactCurrency(category.totalAmount)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}
      </Card>
    </div>
  );
}

// "Khách mời" + "Tài chính" trên desktop nằm cùng 1 hàng (2 cột) để tận dụng chiều ngang,
// mobile vẫn xếp dọc như cũ (mặc định grid-cols-1, chỉ chuyển 2 cột từ breakpoint lg).
function WeddingGuestFinanceRowWidget(props: OverviewRendererProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <WeddingGuestSummaryWidget {...props} />
      <WeddingFinanceSummaryWidget {...props} />
    </div>
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
  weddingGuestFinanceSummary: {
    id: 'weddingGuestFinanceSummary',
    moduleId: 'weddingGuests',
    component: WeddingGuestFinanceRowWidget,
    isAvailable: () => true,
  },
};
