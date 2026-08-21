'use client';

import { Plus } from 'lucide-react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import {
  MilestoneExpensePanel,
  MilestoneSearchControl,
  MilestoneTimelineBoard,
} from '@/modules/milestone';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import {
  TodoList,
  TodoListControls,
  type TodoDueSortOrder,
  type TodoStatusFilter,
} from '@/modules/todo';
import type { TodoDocument } from '@/modules/todo/types/todo';
import type { CategoryOption } from '@/modules/category/types/category';
import type { ExpenseDocument } from '@/modules/expense/types/expense';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { BottomSheet } from '@/shared/components/ui/bottom-sheet';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/utils/cn';
import { TimelineList } from '@/modules/expense/components/timeline-list';
import type { IncomeDocument } from '@/modules/income/types/income';

type PlanningTabProps = {
  allTodosFilteredAndSorted: TodoDocument[];
  categories: CategoryOption[];
  errorMessage: string | null;
  expenseSheetMilestone: MilestoneDocument | null;
  expenseSheetMilestoneExpenses: ExpenseDocument[];
  incomeCategories: CategoryOption[];
  isMilestoneSubmitting: boolean;
  isMilestonesLoading: boolean;
  isOwner: boolean;
  isPlanEnded: boolean;
  isTodoSubmitting: boolean;
  isTodosLoading: boolean;
  members: PlanMemberDocument[];
  milestoneActionError: string | null;
  milestoneSearchQuery: string;
  onCloseExpenseSheet: () => void;
  onCreateMilestone: () => void;
  onAddTodo: (milestone: MilestoneDocument) => void;
  onChangeTodoStatus: (todo: TodoDocument, status: TodoDocument['status']) => void;
  onDeleteMilestone: (milestone: MilestoneDocument) => void;
  onEditMilestone: (milestone: MilestoneDocument) => void;
  onMilestoneQueryChange: (query: string) => void;
  onOpenExpenseSheet: (milestone: MilestoneDocument) => void;
  onOpenMilestoneExpenseCreate: (milestoneId: string) => void;
  onOpenTimelineFromMilestone: () => void;
  onReorderTodos: (milestoneId: string, orderedTodoIds: string[]) => Promise<void>;
  onSelectMilestone: (milestoneId: string | null) => void;
  onSelectExpense: (expense: ExpenseDocument) => void;
  onSelectIncome: (income: IncomeDocument) => void;
  onSortOrderChange: (sortOrder: TodoDueSortOrder) => void;
  onStatusFilterChange: (statusFilter: TodoStatusFilter) => void;
  onViewTodo: (todo: TodoDocument | null) => void;
  planId: string;
  preserveSelectedMilestoneId: string | null;
  searchStatusFilter: TodoStatusFilter;
  selectedMilestone: MilestoneDocument | null;
  selectedTodoSortOrder: TodoDueSortOrder;
  sortedWorkMilestones: MilestoneDocument[];
  todoActionError: string | null;
  todos: TodoDocument[];
  visibleMilestones: MilestoneDocument[];
  workViewMode: 'milestones' | 'todos';
  onWorkViewModeChange: (mode: 'milestones' | 'todos') => void;
};

export function PlanningTab({
  allTodosFilteredAndSorted,
  categories,
  errorMessage,
  expenseSheetMilestone,
  expenseSheetMilestoneExpenses,
  incomeCategories,
  isMilestoneSubmitting,
  isMilestonesLoading,
  isOwner,
  isPlanEnded,
  isTodoSubmitting,
  isTodosLoading,
  members,
  milestoneActionError,
  milestoneSearchQuery,
  onCloseExpenseSheet,
  onCreateMilestone,
  onAddTodo,
  onChangeTodoStatus,
  onDeleteMilestone,
  onEditMilestone,
  onMilestoneQueryChange,
  onOpenExpenseSheet,
  onOpenMilestoneExpenseCreate,
  onOpenTimelineFromMilestone,
  onReorderTodos,
  onSelectMilestone,
  onSelectExpense,
  onSelectIncome,
  onSortOrderChange,
  onStatusFilterChange,
  onViewTodo,
  planId,
  preserveSelectedMilestoneId,
  searchStatusFilter,
  selectedMilestone,
  selectedTodoSortOrder,
  sortedWorkMilestones,
  todoActionError,
  todos,
  visibleMilestones,
  workViewMode,
  onWorkViewModeChange,
}: PlanningTabProps) {
  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Công việc"
        title={
          workViewMode === 'milestones'
            ? 'Lộ trình kế hoạch'
            : 'Tất cả công việc'
        }
        description={
          workViewMode === 'milestones'
            ? 'Theo dõi các mốc quan trọng và công việc cần hoàn thành.'
            : 'Danh sách này gom toàn bộ công việc từ các milestone, giúp bạn rà nhanh tiến độ mà không cần mở từng mốc.'
        }
      />
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex gap-1 rounded-full bg-slate-100 p-1">
          <button
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition',
              workViewMode === 'milestones'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600',
            )}
            onClick={() => onWorkViewModeChange('milestones')}
            type="button"
          >
            Theo mốc
          </button>
          <button
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition',
              workViewMode === 'todos'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600',
            )}
            onClick={() => onWorkViewModeChange('todos')}
            type="button"
          >
            Tất cả công việc
          </button>
        </div>
        {workViewMode === 'todos' ? (
          <TodoListControls
            onSortOrderChange={onSortOrderChange}
            onStatusFilterChange={onStatusFilterChange}
            sortOrder={selectedTodoSortOrder}
            statusFilter={searchStatusFilter}
          />
        ) : (
          <MilestoneSearchControl
            onQueryChange={onMilestoneQueryChange}
            query={milestoneSearchQuery}
          />
        )}
      </div>
      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      {milestoneActionError ? (
        <AuthFormMessage message={milestoneActionError} type="error" />
      ) : null}
      {todoActionError ? (
        <AuthFormMessage message={todoActionError} type="error" />
      ) : null}
      {workViewMode === 'milestones' ? (
        <>
          {isMilestonesLoading ? (
            <Skeleton className="h-48 rounded-[28px]" />
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <MilestoneTimelineBoard
                canManagePlan={isOwner}
                defaultExpandedMilestoneId={selectedMilestone?.id ?? null}
                isMilestoneSubmitting={isMilestoneSubmitting}
                isPlanClosed={Boolean(isPlanEnded)}
                isTodoSubmitting={isTodoSubmitting}
                milestones={sortedWorkMilestones}
                members={members}
                onAddTodo={onAddTodo}
                onReorderTodos={onReorderTodos}
                onChangeTodoStatus={onChangeTodoStatus}
                onEditMilestone={onEditMilestone}
                onDeleteMilestone={onDeleteMilestone}
                onOpenExpenseSheet={onOpenExpenseSheet}
                onSelect={onSelectMilestone}
                onViewTodo={onViewTodo}
                searchQuery={milestoneSearchQuery}
                selectedMilestoneId={preserveSelectedMilestoneId}
                todos={todos}
              />
              {selectedMilestone ? (
                <div className="space-y-4">
                  <div className="hidden lg:block">
                    <MilestoneExpensePanel
                      canCreateExpense={!isPlanEnded}
                      categories={categories}
                      expenses={expenseSheetMilestoneExpenses}
                      members={members}
                      milestone={selectedMilestone}
                      onAddExpense={() =>
                        onOpenMilestoneExpenseCreate(selectedMilestone.id)
                      }
                      onSelectExpense={onSelectExpense}
                      onShowTimeline={onOpenTimelineFromMilestone}
                    />
                  </div>
                </div>
              ) : (
                <Card className="border-slate-200 bg-slate-50 shadow-none">
                  <p className="text-sm leading-6 text-slate-600">
                    Chọn một mốc kế hoạch để xem chi tiết hoặc tạo mốc đầu
                    tiên nếu kế hoạch của bạn chưa có giai đoạn nào.
                  </p>
                </Card>
              )}
            </div>
          )}
          <BottomSheet
            description="Các khoản chi của milestone này được hiển thị theo dạng dòng thời gian."
            onClose={onCloseExpenseSheet}
            open={Boolean(expenseSheetMilestone)}
            title={
              expenseSheetMilestone
                ? `Khoản chi · ${expenseSheetMilestone.title}`
                : 'Khoản chi milestone'
            }
          >
            {expenseSheetMilestone ? (
              <TimelineList
                categories={[...categories, ...incomeCategories]}
                expenses={expenseSheetMilestoneExpenses}
                hideMilestoneFilter
                incomes={[] as IncomeDocument[]}
                members={members}
                milestones={[expenseSheetMilestone]}
                onSelectExpense={onSelectExpense}
                onSelectIncome={onSelectIncome}
                planId={planId}
                selectedMilestoneId={expenseSheetMilestone.id}
              />
            ) : null}
          </BottomSheet>
          {isOwner && !isPlanEnded ? (
            <button
              aria-label="Tạo mốc kế hoạch"
              className="fixed right-4 bottom-24 z-30 flex size-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-[0_14px_34px_rgba(36,59,107,0.32)] transition hover:bg-[var(--color-primary-hover)] md:right-8 md:bottom-8"
              onClick={onCreateMilestone}
              type="button"
            >
              <Plus className="size-6" />
            </button>
          ) : null}
        </>
      ) : (
        <div className="space-y-3">
          {isTodosLoading ? (
            <Skeleton className="h-40 rounded-[28px]" />
          ) : (
            <TodoList
              className="sm:grid-cols-2 lg:grid-cols-3"
              emptyMessage={
                searchStatusFilter === 'done'
                  ? 'Chưa có công việc nào hoàn thành.'
                  : 'Kế hoạch này chưa có công việc nào.'
              }
              members={members}
              milestones={visibleMilestones}
              onViewTodo={onViewTodo}
              preserveOrder
              todos={allTodosFilteredAndSorted}
            />
          )}
        </div>
      )}
    </div>
  );
}
