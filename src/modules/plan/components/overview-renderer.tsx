'use client';

import type { DebtTrackingSummary } from '@/modules/debt-tracking/types/debt-tracking';
import type {
  CounterpartyDebtLedger,
  PlanDebtSummary,
} from '@/modules/debt-tracking/calculators/debt-calculators';
import type { DebtTransaction } from '@/modules/debt-tracking/types/debt-transaction';
import { overviewWidgetRegistry } from '@/modules/plan/constants/overview-widget-registry';
import { getResolvedPlanTypeConfig } from '@/modules/plan/utils/plan-type-config';
import type {
  PlanDocument,
  PlanStatus,
  PlanType,
} from '@/modules/plan/types/plan';
import type { StatisticResult } from '@/modules/statistic/types/statistic';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import type { TodoDocument } from '@/modules/todo';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { TravelActivityDocument } from '@/modules/travel-activity/types/travel-activity';

export type OverviewRendererProps = {
  canManagePlanning: boolean;
  debtTrackingError: string | null;
  debtTrackingSummary: DebtTrackingSummary;
  endedPlanDate: Date | null;
  estimatedByMilestoneId: Record<string, number>;
  isDebtTrackingEnabled: boolean;
  isDebtTrackingLoading: boolean;
  nativeDebtSummary: PlanDebtSummary | null;
  nativeDebtCounterpartyLedgers: CounterpartyDebtLedger[];
  nativeDebtTransactions: DebtTransaction[];
  isNativeDebtLoading: boolean;
  nativeDebtError: string | null;
  isMilestonesLoading: boolean;
  isPlanEnded: boolean;
  isTodosLoading: boolean;
  isTravelActivitiesLoading: boolean;
  isTravelItineraryEnabled: boolean;
  members: PlanMemberDocument[];
  milestoneActionError: string | null;
  onOpenPlanningMilestones: () => void;
  onOpenPlanningTodos: () => void;
  onOpenDebtTracking: () => void;
  onOpenWeddingGuests: () => void;
  onOpenFinance: () => void;
  onOpenTravelItinerary: () => void;
  onViewTodo: (todo: TodoDocument) => void;
  onSelectMemberDrilldown: (memberId: string) => void;
  onSelectMilestoneDrilldown: (milestoneId: string, memberId: string) => void;
  onSelectUpcomingMilestone: (milestoneId: string) => void;
  plan:
    | Pick<
        PlanDocument,
        'planType' | 'status' | 'debtModel' | 'startDate' | 'endDate'
      >
    | PlanType;
  planId: string;
  planStatus: PlanStatus;
  selectedMilestoneId: string | null;
  statistic: StatisticResult;
  estimatedTotal: number;
  todos: TodoDocument[];
  todoActionError: string | null;
  travelActivities: TravelActivityDocument[];
  travelActivityError: string | null;
  upcomingMilestones: MilestoneDocument[];
  upcomingTodos: TodoDocument[];
  visibleMilestones: MilestoneDocument[];
};

export function resolveOverviewWidgets(
  plan: Pick<PlanDocument, 'planType' | 'debtModel'> | PlanType,
  props: OverviewRendererProps,
) {
  const config = getResolvedPlanTypeConfig(plan);

  return config.overview.widgets
    .filter((widgetConfig) => widgetConfig.enabled)
    .sort((left, right) => left.order - right.order)
    .map((widgetConfig) => overviewWidgetRegistry[widgetConfig.widgetId])
    .filter(
      (
        widgetDefinition,
      ): widgetDefinition is NonNullable<typeof widgetDefinition> =>
        widgetDefinition !== undefined && widgetDefinition.isAvailable(props),
    );
}

export function OverviewRenderer(props: OverviewRendererProps) {
  const widgets = resolveOverviewWidgets(props.plan, props);

  return (
    <div className="space-y-6">
      {widgets.map((widget) => {
        const WidgetComponent = widget.component;

        return <WidgetComponent key={widget.id} {...props} />;
      })}
    </div>
  );
}
