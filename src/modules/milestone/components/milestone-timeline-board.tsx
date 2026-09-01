import type { PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  CircleDollarSign,
  PencilLine,
  Plus,
  Trash2,
} from 'lucide-react';

import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import {
  getMilestoneAnchorDate,
  milestoneStatusLabel,
} from '@/modules/milestone/utils/milestone-status';
import { TodoMilestoneCard } from '@/modules/todo/components/todo-milestone-card';
import type { TodoDocument } from '@/modules/todo/types/todo';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { formatCompactCurrency, formatCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import { cn } from '@/shared/utils/cn';
import { getTodoBudgetAmount } from '@/modules/todo/utils/todo-budget';
import { sortTodosByMilestoneOrder } from '@/modules/todo/utils/todo-order';

type MilestoneTimelineBoardProps = {
  milestones: MilestoneDocument[];
  todos: TodoDocument[];
  members: PlanMemberDocument[];
  selectedMilestoneId: string | null;
  defaultExpandedMilestoneId: string | null;
  searchQuery: string;
  // "Công việc" = Planning module (Milestone + Todo), nhưng capability bên
  // dưới vẫn granular theo resource (docs/roles-permissions.md #13, amended).
  // canManageAllPlanning/canManageOwnPlanning: bulk Todo reorder & tạo Todo.
  canManageAllPlanning: boolean;
  canManageOwnPlanning: boolean;
  // canManageAllMilestone/canManageOwnMilestone: sửa/xoá Milestone — own chỉ
  // áp dụng cho milestone do currentUserId tạo, sắp xếp lại (reorder) luôn
  // cần manage_all.
  canManageAllMilestone: boolean;
  canManageOwnMilestone: boolean;
  currentUserId: string | null;
  isPlanClosed: boolean;
  isMilestoneSubmitting: boolean;
  isTodoSubmitting: boolean;
  onSelect: (milestoneId: string) => void;
  onEditMilestone: (milestone: MilestoneDocument) => void;
  onDeleteMilestone: (milestone: MilestoneDocument) => void;
  onAddTodo: (milestone: MilestoneDocument) => void;
  onReorderTodos: (
    milestoneId: string,
    orderedTodoIds: string[],
  ) => Promise<void>;
  onViewTodo: (todo: TodoDocument) => void;
  onChangeTodoStatus: (
    todo: TodoDocument,
    status: TodoDocument['status'],
  ) => void;
  onOpenExpenseSheet: (milestone: MilestoneDocument) => void;
};

type ActiveDragState = {
  milestoneId: string;
  todoId: string;
  originalOrder: string[];
  width: number;
  height: number;
  x: number;
  y: number;
  pointerOffsetY: number;
  hasLifted: boolean;
};

type PendingDragState = {
  milestoneId: string;
  todoId: string;
  startX: number;
  startY: number;
};

function getMilestoneCardTone(
  displayedStatus: MilestoneDocument['status'],
  isSelected: boolean,
) {
  if (isSelected) {
    return {
      card: 'border-[var(--color-milestone-selected-border)] bg-[var(--color-milestone-selected)] text-[var(--color-milestone-selected-foreground)] shadow-[0_24px_70px_rgba(36,59,107,0.22)]',
      titleMuted: 'text-[var(--color-milestone-selected-muted)]',
      valueStrong: 'text-[var(--color-milestone-selected-foreground)]',
      valueSoft: 'text-[var(--color-milestone-selected-muted)]',
      action: 'border border-white/20 bg-[color:color-mix(in_srgb,var(--color-surface-default)_8%,transparent)] text-white hover:bg-[color:color-mix(in_srgb,var(--color-surface-default)_14%,transparent)]',
      mobileExpenseAction: 'secondary' as const,
    };
  }

  if (displayedStatus === 'completed') {
    return {
      card: 'border-[var(--color-milestone-completed-border)] bg-[var(--color-milestone-completed)] text-[var(--color-milestone-completed-foreground)] hover:shadow-[0_14px_40px_rgba(36,92,73,0.08)]',
      titleMuted: 'text-[var(--color-milestone-completed-muted)]',
      valueStrong: 'text-[var(--color-milestone-completed-foreground)]',
      valueSoft: 'text-[var(--color-milestone-completed-muted)]',
      action:
        'bg-[color:color-mix(in_srgb,var(--color-surface-default)_80%,transparent)] text-[var(--color-milestone-completed-foreground)] hover:bg-[var(--color-surface-default)]',
      mobileExpenseAction: 'ghost' as const,
    };
  }

  return {
    card: 'border-[var(--color-milestone-upcoming-border)] bg-[var(--color-milestone-upcoming)] text-[var(--color-milestone-upcoming-foreground)] hover:border-[var(--color-border-strong)] hover:shadow-[0_14px_40px_rgba(15,23,42,0.08)]',
    titleMuted: 'text-[var(--color-milestone-upcoming-muted)]',
    valueStrong: 'text-[var(--color-brand-primary)]',
    valueSoft: 'text-[var(--color-milestone-upcoming-muted)]',
    action: '',
    mobileExpenseAction: 'ghost' as const,
  };
}

function getMilestoneBadgeClass(displayedStatus: MilestoneDocument['status']) {
  if (displayedStatus === 'completed') {
    return 'bg-[var(--color-success-soft)] text-[var(--color-status-success)]';
  }

  if (displayedStatus === 'cancelled') {
    return 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]';
  }

  if (displayedStatus === 'in_progress') {
    return 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]';
  }

  return 'bg-[var(--color-info-soft)] text-[var(--color-info)]';
}

function formatMonthLabel(date: Date | null) {
  if (!date) {
    return 'CHƯA ĐẶT THỜI GIAN';
  }

  return `THÁNG ${date.getMonth() + 1} · ${date.getFullYear()}`;
}

export function MilestoneTimelineBoard({
  milestones,
  todos,
  members,
  selectedMilestoneId,
  defaultExpandedMilestoneId,
  searchQuery,
  canManageAllPlanning,
  canManageOwnPlanning,
  canManageAllMilestone,
  canManageOwnMilestone,
  currentUserId,
  isPlanClosed,
  isMilestoneSubmitting,
  isTodoSubmitting,
  onSelect,
  onEditMilestone,
  onDeleteMilestone,
  onAddTodo,
  onReorderTodos,
  onViewTodo,
  onChangeTodoStatus,
  onOpenExpenseSheet,
}: MilestoneTimelineBoardProps) {
  const AUTO_SCROLL_EDGE_PX = 112;
  const AUTO_SCROLL_SPEED = 12;
  const HOLD_MOVE_CANCEL_PX = 8;
  const [optimisticOrders, setOptimisticOrders] = useState<
    Record<string, string[]>
  >({});
  const [pendingDrag, setPendingDrag] = useState<PendingDragState | null>(null);
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);
  const [expandedMilestoneIds, setExpandedMilestoneIds] = useState<Set<string>>(
    () => new Set(),
  );
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const milestoneCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const justDraggedRef = useRef(false);
  const hasAppliedDefaultExpandRef = useRef(false);
  const hasScrolledToSelectedRef = useRef<string | null>(null);

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  function todoMatchesQuery(todo: TodoDocument) {
    if (!isSearching) {
      return true;
    }

    return `${todo.title} ${todo.description ?? ''}`
      .toLowerCase()
      .includes(trimmedQuery);
  }

  function handleToggleExpand(milestoneId: string) {
    setExpandedMilestoneIds((current) => {
      const next = new Set(current);

      if (next.has(milestoneId)) {
        next.delete(milestoneId);
      } else {
        next.add(milestoneId);
      }

      return next;
    });
  }

  useEffect(() => {
    if (hasAppliedDefaultExpandRef.current || !defaultExpandedMilestoneId) {
      return;
    }

    hasAppliedDefaultExpandRef.current = true;
    setExpandedMilestoneIds(new Set([defaultExpandedMilestoneId]));
  }, [defaultExpandedMilestoneId]);

  useEffect(() => {
    if (
      !selectedMilestoneId ||
      hasScrolledToSelectedRef.current === selectedMilestoneId
    ) {
      return;
    }

    const targetMilestoneId = selectedMilestoneId;
    let attemptsRemaining = 20;
    let frameId: number;

    function tryScroll() {
      const element = milestoneCardRefs.current[targetMilestoneId];

      if (element) {
        hasScrolledToSelectedRef.current = targetMilestoneId;
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      attemptsRemaining -= 1;

      if (attemptsRemaining > 0) {
        frameId = requestAnimationFrame(tryScroll);
      }
    }

    frameId = requestAnimationFrame(tryScroll);

    return () => cancelAnimationFrame(frameId);
  }, [selectedMilestoneId]);

  const todosByMilestone = useMemo(
    () =>
      Object.fromEntries(
        milestones.map((milestone) => [
          milestone.id,
          sortTodosByMilestoneOrder(
            todos.filter((todo) => todo.milestoneId === milestone.id),
          ),
        ]),
      ) as Record<string, TodoDocument[]>,
    [milestones, todos],
  );

  useEffect(() => {
    function clearPendingDrag() {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      setPendingDrag(null);
    }

    function handlePointerMove(event: PointerEvent) {
      if (!activeDrag) {
        if (pendingDrag) {
          const dx = event.clientX - pendingDrag.startX;
          const dy = event.clientY - pendingDrag.startY;

          if (Math.hypot(dx, dy) > HOLD_MOVE_CANCEL_PX) {
            clearPendingDrag();
          }
        }

        return;
      }

      event.preventDefault();

      if (event.clientY < AUTO_SCROLL_EDGE_PX) {
        window.scrollBy({ top: -AUTO_SCROLL_SPEED, behavior: 'auto' });
      } else if (window.innerHeight - event.clientY < AUTO_SCROLL_EDGE_PX) {
        window.scrollBy({ top: AUTO_SCROLL_SPEED, behavior: 'auto' });
      }

      const currentOrder =
        optimisticOrders[activeDrag.milestoneId] ?? activeDrag.originalOrder;
      const otherTodoIds = currentOrder.filter(
        (todoId) => todoId !== activeDrag.todoId,
      );
      let insertAt = otherTodoIds.length;

      for (let index = 0; index < otherTodoIds.length; index += 1) {
        const candidateTodoId = otherTodoIds[index];

        if (!candidateTodoId) {
          continue;
        }

        const rect = itemRefs.current[candidateTodoId]?.getBoundingClientRect();

        if (rect && event.clientY < rect.top + rect.height / 2) {
          insertAt = index;
          break;
        }
      }

      const nextOrder = [...otherTodoIds];
      nextOrder.splice(insertAt, 0, activeDrag.todoId);

      setOptimisticOrders((current) => ({
        ...current,
        [activeDrag.milestoneId]: nextOrder,
      }));
      setActiveDrag((current) =>
        current
          ? {
              ...current,
              y: event.clientY - current.pointerOffsetY,
              hasLifted: true,
            }
          : current,
      );
    }

    function handlePointerUp() {
      clearPendingDrag();

      if (!activeDrag) {
        return;
      }

      justDraggedRef.current = true;

      const finalOrder =
        optimisticOrders[activeDrag.milestoneId] ?? activeDrag.originalOrder;
      const hasOrderChanged =
        finalOrder.join('|') !== activeDrag.originalOrder.join('|');
      const nextMilestoneId = activeDrag.milestoneId;
      const originalOrder = activeDrag.originalOrder;

      setActiveDrag(null);

      if (!hasOrderChanged) {
        setOptimisticOrders((current) => {
          const next = { ...current };
          delete next[nextMilestoneId];
          return next;
        });
        return;
      }

      void onReorderTodos(nextMilestoneId, finalOrder).catch(() => {
        setOptimisticOrders((current) => ({
          ...current,
          [nextMilestoneId]: originalOrder,
        }));
      });
    }

    window.addEventListener('pointermove', handlePointerMove, {
      passive: false,
    });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [activeDrag, onReorderTodos, optimisticOrders, pendingDrag]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  if (milestones.length === 0) {
    return (
      <Card className="border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] shadow-none">
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
          Chưa có mốc kế hoạch nào. Hãy tạo mốc đầu tiên để bắt đầu tổ chức kế
          hoạch theo giai đoạn.
        </p>
      </Card>
    );
  }

  const selectedMilestone =
    milestones.find((milestone) => milestone.id === selectedMilestoneId) ??
    null;
  const selectedMonthLabel = selectedMilestone
    ? formatMonthLabel(getMilestoneAnchorDate(selectedMilestone))
    : null;
  const visibleMilestones = isSearching
    ? milestones.filter((milestone) =>
        (todosByMilestone[milestone.id] ?? []).some(todoMatchesQuery),
      )
    : milestones;
  const visibleMonthLabels = visibleMilestones.map((milestone) =>
    formatMonthLabel(getMilestoneAnchorDate(milestone)),
  );

  function handleViewTodo(todo: TodoDocument) {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }

    onViewTodo(todo);
  }

  function getDisplayedMilestoneTodos(milestoneId: string) {
    const milestoneTodos = todosByMilestone[milestoneId] ?? [];
    const orderIds = optimisticOrders[milestoneId];

    if (!orderIds) {
      return milestoneTodos;
    }

    const todoMap = new Map(milestoneTodos.map((todo) => [todo.id, todo]));
    const orderedTodos = orderIds
      .map((todoId) => todoMap.get(todoId))
      .filter((todo): todo is TodoDocument => Boolean(todo));
    const seenIds = new Set(orderIds);

    return [
      ...orderedTodos,
      ...milestoneTodos.filter((todo) => !seenIds.has(todo.id)),
    ];
  }

  function handleTodoPointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
    milestoneId: string,
    todoId: string,
  ) {
    if (!canManageAllPlanning || isPlanClosed || isTodoSubmitting) {
      return;
    }

    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    const clientX = event.clientX;
    const clientY = event.clientY;

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }

    const originalOrder = getDisplayedMilestoneTodos(milestoneId).map(
      (todo) => todo.id,
    );

    setPendingDrag({
      milestoneId,
      todoId,
      startX: clientX,
      startY: clientY,
    });

    holdTimerRef.current = setTimeout(() => {
      const element = itemRefs.current[todoId];

      if (!element) {
        setPendingDrag(null);
        return;
      }

      const rect = element.getBoundingClientRect();

      setOptimisticOrders((current) => ({
        ...current,
        [milestoneId]: originalOrder,
      }));
      setActiveDrag({
        milestoneId,
        todoId,
        originalOrder,
        width: rect.width,
        height: rect.height,
        x: rect.left,
        y: rect.top,
        pointerOffsetY: clientY - rect.top,
        hasLifted: false,
      });
      setPendingDrag(null);
      holdTimerRef.current = null;

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(18);
      }
    }, 180);
  }

  return (
    <div className="space-y-6">
      {(() => {
        const draggedTodo = activeDrag
          ? (todos.find((todo) => todo.id === activeDrag.todoId) ?? null)
          : null;

        return draggedTodo && activeDrag ? (
          <div
            className={cn(
              'pointer-events-none fixed z-50 opacity-95 transition-transform duration-150',
              activeDrag.hasLifted ? 'scale-[1.03]' : 'scale-[0.99]',
            )}
            style={{
              left: activeDrag.x,
              top: activeDrag.y,
              width: activeDrag.width,
            }}
          >
            <TodoMilestoneCard
              assignee={
                members.find(
                  (member) => member.id === draggedTodo.assigneeMemberId,
                ) ?? null
              }
              canToggle={false}
              isPreview
              isSubmitting
              onChangeStatus={() => undefined}
              onView={() => undefined}
              todo={draggedTodo}
            />
          </div>
        ) : null;
      })()}
      {isSearching && visibleMilestones.length === 0 ? (
        <Card className="border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] shadow-none">
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            Không tìm thấy công việc nào phù hợp với từ khoá tìm kiếm.
          </p>
        </Card>
      ) : null}
      {visibleMilestones.map((milestone, index) => {
        const isSelected = milestone.id === selectedMilestoneId;
        const milestoneTodos = getDisplayedMilestoneTodos(milestone.id).filter(
          todoMatchesQuery,
        );
        const estimatedBudget = milestoneTodos.reduce(
          (total, todoItem) => total + (getTodoBudgetAmount(todoItem) ?? 0),
          0,
        );
        const startDate = timestampToDate(milestone.startDate);
        const endDate = timestampToDate(milestone.endDate);
        const displayedStatus = milestone.status;
        const monthLabel = visibleMonthLabels[index];
        const shouldShowMonthLabel = index === 0 || monthLabel !== visibleMonthLabels[index - 1];
        const isMonthSelected =
          selectedMonthLabel !== null && monthLabel === selectedMonthLabel;
        const tone = getMilestoneCardTone(displayedStatus, isSelected);
        const shouldExpandDetails =
          isSearching || expandedMilestoneIds.has(milestone.id);
        const canManageThisMilestone =
          canManageAllMilestone ||
          (canManageOwnMilestone && milestone.createdByUserId === currentUserId);

        return (
          <div
            className="relative"
            key={milestone.id}
            ref={(element) => {
              milestoneCardRefs.current[milestone.id] = element;
            }}
          >
            {shouldShowMonthLabel ? (
              <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
                <span
                  className={cn(
                    'relative flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-default)] ring-2 sm:size-7 sm:ring-4',
                    isMonthSelected
                      ? 'ring-[color:color-mix(in_srgb,var(--color-brand-primary)_10%,transparent)]'
                      : 'ring-[var(--color-border-subtle)]',
                  )}
                >
                  {isMonthSelected ? (
                    <span className="absolute size-2.5 animate-ping-lg rounded-full bg-[color:color-mix(in_srgb,var(--color-brand-primary)_6%,transparent)] sm:size-3" />
                  ) : null}
                  <span
                    className={cn(
                      'relative size-2.5 rounded-full sm:size-3',
                      isMonthSelected ? 'bg-[var(--color-brand-primary)]' : 'bg-[var(--color-surface-overlay)]',
                    )}
                  />
                </span>
                <p
                  className={cn(
                    'text-[11px] font-semibold uppercase tracking-[0.14em] sm:text-xs sm:tracking-[0.22em]',
                    isMonthSelected ? 'text-[var(--color-brand-primary)]' : 'text-[var(--color-text-muted)]',
                  )}
                >
                  {monthLabel}
                </p>
              </div>
            ) : null}

            <button
              className={cn(
                'group relative z-[1] w-full rounded-[20px] border p-0 text-left transition sm:rounded-[32px] lg:rounded-[20px]',
                tone.card,
              )}
              onClick={() => {
                onSelect(milestone.id);
                handleToggleExpand(milestone.id);
              }}
              type="button"
            >
              <div className="space-y-3 p-4 sm:space-y-5 sm:p-6 lg:space-y-3 lg:p-4">
                <div className="flex items-start justify-between gap-2 sm:gap-3 lg:gap-2">
                  <div className="min-w-0 space-y-2 sm:space-y-3 lg:space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-[19px] font-semibold sm:text-2xl lg:text-lg">
                        {milestone.title}
                      </h3>
                      <Badge
                        className={getMilestoneBadgeClass(displayedStatus)}
                      >
                        {milestoneStatusLabel[displayedStatus]}
                      </Badge>
                    </div>
                    <p
                      className={cn(
                        'hidden text-sm leading-6 md:block',
                        tone.titleMuted,
                      )}
                    >
                      {milestone.description ||
                        'Chưa có mô tả cho milestone này.'}
                    </p>
                    <div
                      className={cn(
                        'hidden items-center gap-2 text-sm md:inline-flex',
                        tone.titleMuted,
                      )}
                    >
                      <CalendarDays className="size-4 shrink-0" />
                      <span>
                        {startDate ? formatDate(startDate) : 'Chưa đặt'} -{' '}
                        {endDate ? formatDate(endDate) : 'Chưa đặt'}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-start gap-2">
                    <Button
                      className="size-8 min-h-8 justify-center px-0 sm:size-9 sm:min-h-9 lg:hidden"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenExpenseSheet(milestone);
                      }}
                      variant={tone.mobileExpenseAction}
                    >
                      <CircleDollarSign className="size-4" />
                    </Button>
                    {canManageThisMilestone ? (
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          className={cn(
                            'size-8 min-h-8 justify-center px-0 sm:size-9 sm:min-h-9 lg:size-8 lg:min-h-8',
                            tone.action,
                          )}
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditMilestone(milestone);
                          }}
                          variant={isSelected ? 'ghost' : 'secondary'}
                        >
                          <PencilLine className="size-4" />
                        </Button>
                        <Button
                          aria-label={`Xoá mốc ${milestone.title}`}
                          className={cn(
                            'size-8 min-h-8 justify-center px-0 hover:bg-rose-50 hover:text-rose-600 sm:size-9 sm:min-h-9 lg:size-8 lg:min-h-8',
                            tone.action,
                          )}
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteMilestone(milestone);
                          }}
                          variant={isSelected ? 'ghost' : 'secondary'}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm sm:gap-3 lg:gap-2">
                  <div>
                    <p
                      className={cn(
                        'text-[11px] uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.16em] lg:text-[11px] lg:tracking-[0.12em]',
                        tone.titleMuted,
                      )}
                    >
                      Đã chi
                    </p>
                    <p
                      className={cn(
                        'mt-1 text-[17px] font-semibold sm:mt-2 sm:text-2xl lg:mt-1 lg:text-base',
                        tone.valueStrong,
                      )}
                    >
                      {formatCompactCurrency(milestone.totalExpense)}
                    </p>
                  </div>
                  <div>
                    <p
                      className={cn(
                        'text-[11px] uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.16em] lg:text-[11px] lg:tracking-[0.12em]',
                        tone.titleMuted,
                      )}
                    >
                      Dự kiến chi
                    </p>
                    <p
                      className={cn(
                        'mt-1 text-[17px] font-semibold sm:mt-2 sm:text-2xl lg:mt-1 lg:text-base',
                        tone.valueSoft,
                      )}
                    >
                      {formatCompactCurrency(estimatedBudget)}
                    </p>
                  </div>
                  <div>
                    <p
                      className={cn(
                        'text-[11px] uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.16em] lg:text-[11px] lg:tracking-[0.12em]',
                        tone.titleMuted,
                      )}
                    >
                      Công việc
                    </p>
                    <p className="mt-1 text-[17px] font-semibold sm:mt-2 sm:text-2xl lg:mt-1 lg:text-base">
                      {milestone.completedTodoCount}/{milestone.todoCount}
                    </p>
                  </div>
                </div>
              </div>
            </button>

            <div
              aria-hidden={!shouldExpandDetails}
              className={cn(
                'ml-[11px] overflow-hidden transition-[max-height,opacity,margin,transform] duration-300 ease-out sm:ml-4 lg:ml-[11px]',
                shouldExpandDetails
                  ? 'mt-3 max-h-[2200px] opacity-100 sm:mt-4'
                  : 'mt-0 max-h-0 translate-y-[-6px] opacity-0 pointer-events-none',
              )}
            >
              <div className="space-y-2 pl-2 sm:space-y-3 sm:pl-3 lg:space-y-2 lg:pl-2">
                <div className="relative">
                  {milestoneTodos.length > 0 ? (
                    <>
                      <span className="absolute left-3 top-0 bottom-0 z-0 w-px bg-[var(--color-border-subtle)] sm:left-4 lg:left-3" />
                      {milestoneTodos.map((todo) => {
                        const assignee =
                          members.find(
                            (member) => member.id === todo.assigneeMemberId,
                          ) ?? null;
                        const canToggle = canManageOwnPlanning && !isPlanClosed;
                        const isDraggingTodo =
                          activeDrag?.todoId === todo.id &&
                          activeDrag.milestoneId === milestone.id;
                        const isPendingTodo =
                          pendingDrag?.todoId === todo.id &&
                          pendingDrag.milestoneId === milestone.id;

                        return (
                          <div
                            key={todo.id}
                            className="mb-2 flex gap-2 last:mb-0 sm:mb-3 sm:gap-3 lg:mb-2 lg:gap-2"
                            onClick={(event) => event.stopPropagation()}
                            ref={(element) => {
                              itemRefs.current[todo.id] = element;
                            }}
                          >
                            <div className="relative w-6 shrink-0 sm:w-8 lg:w-6">
                              <span className="absolute left-1/2 top-1/2 z-10 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-surface-overlay)] sm:size-2" />
                            </div>
                            <div className="min-w-0 flex-1">
                              {isDraggingTodo && activeDrag ? (
                                <div
                                  className="rounded-2xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] shadow-inner transition-all duration-200 animate-pulse sm:rounded-[24px]"
                                  style={{ height: activeDrag.height }}
                                />
                              ) : (
                                <div
                                  className={cn(
                                    'transition duration-150',
                                    isPendingTodo
                                      ? 'scale-[1.02] opacity-80'
                                      : '',
                                  )}
                                >
                                  <TodoMilestoneCard
                                    assignee={assignee}
                                    canToggle={canToggle}
                                    isSubmitting={isTodoSubmitting}
                                    onChangeStatus={onChangeTodoStatus}
                                    onView={handleViewTodo}
                                    todo={todo}
                                    {...(canManageAllPlanning && !isPlanClosed
                                      ? {
                                          onHoldPointerDown: (
                                            event: ReactPointerEvent<HTMLDivElement>,
                                          ) =>
                                            handleTodoPointerDown(
                                              event,
                                              milestone.id,
                                              todo.id,
                                            ),
                                        }
                                      : {})}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <p className="px-1 text-sm text-[var(--color-text-muted)]">
                      Milestone này chưa có todo nào.
                    </p>
                  )}
                </div>

                <button
                  className={cn(
                    'flex min-h-11 w-full items-center justify-center gap-2 rounded-[18px] px-4 py-2.5 text-sm font-semibold transition',
                    canManageOwnPlanning && !isPlanClosed
                      ? 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-default)] hover:text-[var(--color-brand-primary)]'
                      : 'cursor-not-allowed bg-transparent text-[var(--color-text-muted)]',
                  )}
                  disabled={!canManageOwnPlanning || isPlanClosed}
                  onClick={(event) => {
                    event.stopPropagation();
                    onAddTodo(milestone);
                  }}
                  type="button"
                >
                  <Plus className="size-5" />
                  Thêm công việc
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
