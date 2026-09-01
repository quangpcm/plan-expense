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
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { DataRow } from '@/shared/components/ui/data-row';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { ErrorState } from '@/shared/components/ui/error-state';
import { Metric } from '@/shared/components/ui/metric';
import { Section } from '@/shared/components/ui/section';
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

// Adopts the canonical Button (Wave 2 ghost variant) for real button semantics/focus-visible,
// but overrides size/shape back down to a plain text link — Button's own sm/md sizes assume real
// button chrome (padding, min-height, pill shape), which this lightweight "Xem thêm" link never
// had. Foundation finding for later: Core Primitives has no canonical "link" footprint yet.
function ViewAllAction({ onClick }: { onClick: () => void }) {
  return (
    <Button
      className="h-auto min-h-0 gap-0 rounded-none p-0 text-sm font-medium text-[var(--color-brand-primary)] hover:bg-transparent hover:text-[var(--color-brand-primary-hover)]"
      onClick={onClick}
      variant="ghost"
    >
      Xem thêm ➔
    </Button>
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
        'block w-full px-4 py-4 text-left transition hover:bg-[var(--color-surface-subtle)]',
        // Desktop: lightweight bordered row instead of a nested elevated card — matches the
        // canonical 20px radius already used by the "Sắp tới" DataRow rows below in this same
        // widget, no independent drop shadow/hover-lift layered on top of the parent Card.
        'lg:rounded-[20px] lg:border lg:border-[var(--color-border-subtle)] lg:bg-[var(--color-surface-default)]',
        'lg:hover:border-[var(--color-border-default)] lg:hover:bg-[var(--color-surface-subtle)]',
      )}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[var(--color-text-primary)]">{todo.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[var(--color-text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <FolderOpen className="size-3.5 text-[var(--color-text-muted)]" />
              {milestoneTitle}
            </span>
            <span className="text-[var(--color-text-muted)]">|</span>
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
    <Section
      action={<ViewAllAction onClick={onOpenPlanningTodos} />}
      description={summary}
      eyebrow="Cần chú ý"
      title="Công việc"
    >
      {todoActionError ? <AuthFormMessage message={todoActionError} type="error" /> : null}
      {isTodosLoading ? (
        <Skeleton className="h-56 rounded-[var(--radius-ds-lg)]" />
      ) : (
        <Card className="gap-5 rounded-[var(--radius-ds-lg)] shadow-none">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                Cần xử lý ngay
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {summary || 'Không có việc quá hạn hoặc đến hạn hôm nay.'}
              </p>
            </div>
            {/* Positive/all-clear state, not "nothing to show" — kept as a lightweight
                product-specific state rather than EmptyState (Pilot review decision). */}
            {attentionItems.length === 0 ? (
              <div className="flex items-center gap-3 rounded-[24px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-4">
                <CheckCircle2 className="size-5 shrink-0 text-[var(--color-status-success)]" />
                <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                  Mọi việc đang trong tầm kiểm soát.
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  'gap-0 divide-y divide-slate-100 overflow-hidden rounded-[28px] border border-[var(--color-border-subtle)]',
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

          <div className="space-y-3 border-t border-[var(--color-border-subtle)] pt-1">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Sắp tới</p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Các công việc tiếp theo trong thời gian tới.
              </p>
            </div>
            {/* Sub-section zero state, not a full EmptyState — kept lightweight (Pilot review
                decision). */}
            {nextTodoItems.length === 0 ? (
              <p className="text-sm leading-6 text-[var(--color-text-muted)]">
                Không có công việc nào sắp đến hạn.
              </p>
            ) : (
              <div className="space-y-3">
                {/* COMPOSE DataRow: clean fit here (no responsive card-ification unlike
                    AttentionItemRow below), so unlike that one this genuinely simplifies. */}
                {nextTodoItems.map((item) => (
                  <DataRow
                    className="rounded-[20px] border border-[var(--color-border-subtle)] px-4 hover:border-[var(--color-border-default)]"
                    key={item.todo.id}
                    main={
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                          {item.todo.title}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          {milestoneTitleById.get(item.todo.milestoneId) ?? 'Không có mốc'}
                        </p>
                      </div>
                    }
                    onClick={() => onViewTodo(item.todo)}
                    trailing={
                      <span className="shrink-0 text-sm font-medium text-[var(--color-text-muted)]">
                        {formatDueCountdown(item.dueDate)}
                      </span>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </Section>
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
    // Per-consumer classification (Pilot review decision): standard contained surface →
    // radius-ds-lg / elevation.none, same as the other widget-body Cards in this file.
    <Card className="min-w-0 gap-3 rounded-[var(--radius-ds-lg)] shadow-none">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
              {title}
            </p>
            <p className="mt-1 truncate text-lg font-semibold text-[var(--color-text-primary)]">
              {milestone.title}
            </p>
          </div>
          <Badge variant={tone === 'current' ? 'warning' : 'info'}>{statusLabel}</Badge>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {milestone.completedTodoCount}/{milestone.todoCount} công việc
          {tone === 'current' ? ` · ${progress}%` : ''}
        </p>
      </div>
      {tone === 'current' ? (
        <>
          <div className="space-y-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
              <div
                className="h-full rounded-full bg-[var(--color-brand-primary)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            <span className="font-semibold text-[var(--color-text-primary)]">
              {formatCompactCurrency(milestone.totalExpense)}
            </span>{' '}
            đã chi · {formatCompactCurrency(estimatedTotal)} dự kiến
          </p>
        </>
      ) : (
        <p className="text-sm text-[var(--color-text-secondary)]">
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
    <Section
      action={<ViewAllAction onClick={onOpenPlanningMilestones} />}
      eyebrow="Kế hoạch"
      title="Tiến độ kế hoạch"
    >
      {milestoneActionError ? <AuthFormMessage message={milestoneActionError} type="error" /> : null}
      {isMilestonesLoading ? (
        <Skeleton className="h-32 rounded-[var(--radius-ds-lg)]" />
      ) : !currentMilestone ? (
        // EmptyState candidate approved in Pilot review — genuine "nothing to show" state.
        <Card className="rounded-[var(--radius-ds-lg)] border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] shadow-none">
          <EmptyState title="Không có mốc nào đang diễn ra hoặc sắp diễn ra." />
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
    </Section>
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
    barClass: 'bg-[var(--color-status-success)]',
    colorClass: 'text-[var(--color-status-success)]',
    icon: CheckCircle2,
  },
  pending: {
    barClass: 'bg-[var(--color-status-warning)]',
    colorClass: 'text-[var(--color-status-warning)]',
    icon: Clock3,
  },
  not_attending: {
    // --color-text-muted aliases to --color-text-secondary (Wave 1), not --color-text-muted.
    barClass: 'bg-[var(--color-text-secondary)]',
    colorClass: 'text-[var(--color-text-secondary)]',
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
    <Section
      action={<ViewAllAction onClick={onOpenWeddingGuests} />}
      eyebrow="Khách mời"
      title="Tình hình khách mời"
    >
      <Card className="gap-3 rounded-[var(--radius-ds-lg)] shadow-none">
        {errorMessage ? (
          // ErrorState approved in Pilot review: genuine content-area data-fetch failure.
          // Title is new structural scaffolding (ErrorState requires one); errorMessage itself
          // — the only content that existed before — is preserved verbatim as the description.
          <ErrorState description={errorMessage} title="Không thể tải thông tin khách mời" />
        ) : isLoading ? (
          <Skeleton className="h-24 rounded-[var(--radius-ds-lg)]" />
        ) : total === 0 ? (
          // EmptyState candidate approved in Pilot review — genuine "nothing to show" state.
          <EmptyState title="Chưa có khách mời nào được thêm vào kế hoạch." />
        ) : (
          <>
            {/* Metric candidate approved in Pilot review — must keep `total` (invitation count)
                and `statistic.attendeeCount` (expected-attendee count) as two distinct values;
                never merge into one number (see Pre-Code §6 invariant mapping). */}
            <Metric
              label="Lời mời"
              leading={
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand-primary)]">
                  <Users className="size-5" />
                </div>
              }
              supporting={`${statistic.attendeeCount} người dự kiến`}
              value={total}
            />
            <div className="space-y-2 text-sm">
              {(['attending', 'pending', 'not_attending'] as const).map((status) => {
                const tone = RSVP_TONE[status];
                const Icon = tone.icon;

                return (
                  <div className="flex items-center justify-between" key={status}>
                    <span className="inline-flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                      <Icon className={cn('size-4 shrink-0', tone.colorClass)} />
                      {RSVP_LABEL[status]}
                    </span>
                    <span className={cn('font-semibold', tone.colorClass)}>{rsvpBreakdown[status]}</span>
                  </div>
                );
              })}
            </div>
            <div className="space-y-1.5">
              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
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
              <p className="text-xs font-medium text-[var(--color-status-success)]">{confirmedPercent}% đã phản hồi</p>
            </div>
            {rsvpBreakdown.pending > 0 ? (
              <div className="rounded-2xl border border-[var(--color-status-warning-surface)] bg-[var(--color-status-warning-surface)]/40 px-4 py-3">
                <p className="text-sm font-medium text-[var(--color-status-warning)]">
                  {rsvpBreakdown.pending} lời mời đang chờ phản hồi
                </p>
                {pendingGroups[0] ? (
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    Nhiều nhất ở nhóm {pendingGroups[0].group.name}
                  </p>
                ) : null}
              </div>
            ) : null}
            {topGroups.length > 0 ? (
              <div className="space-y-1.5 border-t border-[var(--color-border-subtle)] pt-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Người tham dự</p>
                {topGroups.map((row) => (
                  <div className="flex items-center justify-between text-sm" key={row.group.id}>
                    <span className="text-[var(--color-text-secondary)]">{row.group.name}</span>
                    <Badge variant="info">{row.attendeeCount} dự kiến</Badge>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        )}
      </Card>
    </Section>
  );
}

// Ngưỡng "khoẻ mạnh" của ngân sách — dùng đúng token semantic (success/warning/danger) để
// progress bar trở thành tín hiệu cảnh báo thật, không chỉ trang trí.
function getBudgetHealthTone(usedPercent: number) {
  if (usedPercent > 100) {
    return { barClass: 'bg-[var(--color-status-danger)]', textClass: 'text-[var(--color-status-danger)]' };
  }

  if (usedPercent >= 70) {
    return { barClass: 'bg-[var(--color-status-warning)]', textClass: 'text-[var(--color-status-warning)]' };
  }

  return { barClass: 'bg-[var(--color-status-success)]', textClass: 'text-[var(--color-status-success)]' };
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
    <Section
      action={<ViewAllAction onClick={onOpenFinance} />}
      eyebrow="Tài chính"
      title="Ngân sách kế hoạch"
    >
      <Card className="gap-3 rounded-[var(--radius-ds-lg)] shadow-none">
        <div className="space-y-1.5">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Đã chi <span className="font-semibold text-[var(--color-text-primary)]">{formatCompactCurrency(spent)}</span>
            {' / '}
            {formatCompactCurrency(estimatedTotal)}
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
            <div
              className={cn('h-full rounded-full', budgetTone.barClass)}
              style={{ width: `${Math.min(usedPercent, 100)}%` }}
            />
          </div>
          <p className={cn('text-xs font-medium', budgetTone.textClass)}>
            {usedPercent}% ngân sách{usedPercent > 100 ? ' — đã vượt dự kiến' : ''}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Còn dự kiến{' '}
            <span className="font-semibold text-[var(--color-text-primary)]">
              {formatCompactCurrency(remainingBudget)}
            </span>
          </p>
        </div>
        {topCategories.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Chi nhiều nhất</p>
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
                    <span className="truncate text-[var(--color-text-secondary)]">{category.categoryName}</span>
                  </span>
                  <span className="shrink-0 font-medium text-[var(--color-text-primary)]">
                    {formatCompactCurrency(category.totalAmount)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}
      </Card>
    </Section>
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
