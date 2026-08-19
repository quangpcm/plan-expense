'use client';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { MilestoneList } from '@/modules/milestone';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import { CategoryBreakdown } from '@/modules/statistic/components/category-breakdown';
import { CompletedPlanOverview } from '@/modules/statistic/components/completed-plan-overview';
import { MilestoneBreakdown } from '@/modules/statistic/components/milestone-breakdown';
import { StatisticOverview } from '@/modules/statistic/components/statistic-overview';
import type { StatisticResult } from '@/modules/statistic/types/statistic';
import {
  TodoList,
  type TodoDocument,
} from '@/modules/todo';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanStatus } from '@/modules/plan/types/plan';
import { Button } from '@/shared/components/ui/button';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatDate } from '@/shared/utils/date';

type OverviewTabProps = {
  canManagePlanning: boolean;
  endedPlanDate: Date | null;
  estimatedByMilestoneId: Record<string, number>;
  isMilestonesLoading: boolean;
  isPlanEnded: boolean;
  isTodoSubmitting: boolean;
  isTodosLoading: boolean;
  members: PlanMemberDocument[];
  milestoneActionError: string | null;
  onOpenPlanningMilestones: () => void;
  onOpenPlanningTodo: (todo: TodoDocument) => void;
  onOpenPlanningTodos: () => void;
  onSelectMemberDrilldown: (memberId: string) => void;
  onSelectMilestoneDrilldown: (milestoneId: string, memberId: string) => void;
  onSelectUpcomingMilestone: (milestoneId: string) => void;
  onToggleTodoStatus: (todo: TodoDocument, status: TodoDocument['status']) => void;
  onDeleteTodo: (todo: TodoDocument) => void;
  onAddVendor: (todo: TodoDocument) => void;
  planStatus: PlanStatus;
  selectedMilestoneId: string | null;
  statistic: StatisticResult;
  todoActionError: string | null;
  upcomingMilestones: MilestoneDocument[];
  upcomingTodos: TodoDocument[];
  visibleMilestones: MilestoneDocument[];
};

export function OverviewTab({
  canManagePlanning,
  endedPlanDate,
  estimatedByMilestoneId,
  isMilestonesLoading,
  isPlanEnded,
  isTodoSubmitting,
  isTodosLoading,
  members,
  milestoneActionError,
  onOpenPlanningMilestones,
  onOpenPlanningTodo,
  onOpenPlanningTodos,
  onSelectMemberDrilldown,
  onSelectMilestoneDrilldown,
  onSelectUpcomingMilestone,
  onToggleTodoStatus,
  onDeleteTodo,
  onAddVendor,
  planStatus,
  selectedMilestoneId,
  statistic,
  todoActionError,
  upcomingMilestones,
  upcomingTodos,
  visibleMilestones,
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {isPlanEnded ? (
        <>
          <CompletedPlanOverview
            endedAtLabel={endedPlanDate ? formatDate(endedPlanDate) : 'Đã kết thúc'}
            onSelectMember={onSelectMemberDrilldown}
            planStatus={planStatus}
            statistic={statistic}
          />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <CategoryBreakdown statistic={statistic} />
            <MilestoneBreakdown
              onSelectMilestoneMember={onSelectMilestoneDrilldown}
              statistic={statistic}
            />
          </div>
        </>
      ) : (
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
            <Button className="w-full justify-center" onClick={onOpenPlanningMilestones} variant="ghost">
              Xem tất cả mốc
            </Button>
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
            <Button className="w-full justify-center" onClick={onOpenPlanningTodos} variant="ghost">
              Xem tất cả công việc
            </Button>
          </div>

          <div className="space-y-3">
            <SectionHeading eyebrow="Tài chính" title="Thu chi kế hoạch" />
            <StatisticOverview statistic={statistic} />
          </div>
        </>
      )}
    </div>
  );
}
