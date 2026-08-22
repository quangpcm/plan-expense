'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  notFound,
  useParams,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import {
  BarChart3,
  Clock,
  Flag,
  Gift,
  LayoutDashboard,
  Lock,
  LogOut,
  MoreVertical,
  PencilLine,
  Settings,
  Trash2,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { usePlanInvitations } from '@/modules/invitation/hooks/use-plan-invitations';
import { invitationService } from '@/modules/invitation/services';
import type { InvitationDocument } from '@/modules/invitation/types/invitation';
import { IncomeDetailPanel } from '@/modules/income/components/income-detail-panel';
import { IncomeForm } from '@/modules/income/components/income-form';
import { useIncomes } from '@/modules/income/hooks/use-incomes';
import { incomeService } from '@/modules/income/services';
import type { IncomeDocument } from '@/modules/income/types/income';
import {
  getExpenseCategories,
  getIncomeCategories,
} from '@/modules/category/constants/category-presets';
import { ExpenseDetailPanel } from '@/modules/expense/components/expense-detail-panel';
import { ExpenseForm } from '@/modules/expense/components/expense-form';
import { TimelineList } from '@/modules/expense/components/timeline-list';
import { useExpenses } from '@/modules/expense/hooks/use-expenses';
import { expenseService } from '@/modules/expense/services';
import type { ExpenseDocument } from '@/modules/expense/types/expense';
import type { FinanceDesktopDetail } from '@/modules/expense/components/finance-tab';
import { FinanceTab } from '@/modules/expense';
import { MemberAvatarStack } from '@/modules/member/components/member-avatar-stack';
import { usePlanMembers } from '@/modules/member/hooks/use-plan-members';
import { hasPlanCapability } from '@/modules/member/services/permission.service';
import { memberService } from '@/modules/member/services';
import { MembersTab } from '@/modules/member';
import type {
  PlanMemberDocument,
  PlanRole,
} from '@/modules/member/types/member';
import { buildLinkedMemberIdSet } from '@/modules/member/utils/member-linkage';
import type { ConfigurableModuleId, ModuleAccessLevel } from '@/modules/plan/types/plan-modular';
import { EditPlanForm } from '@/modules/plan/components/edit-plan-form';
import { PlanUnlockGate } from '@/modules/plan/components/plan-unlock-gate';
import { PLAN_ARCHIVE_RETENTION_DAYS, planTypeOptions } from '@/modules/plan/constants/plan.constants';
import { planService } from '@/modules/plan/services';
import { usePlan } from '@/modules/plan/hooks/use-plan';
import { useUserPlans } from '@/modules/plan/hooks/use-user-plans';
import {
  getPlanDetailTabs,
  hasPlanModule,
  OverviewTab,
  resolvePlanDebtModel,
  resolvePlanDetailTab,
} from '@/modules/plan';
import type { PlanStatus } from '@/modules/plan/types/plan';
import { getEffectiveBudgetAmount } from '@/modules/plan/utils/get-effective-budget-amount';
import { PasscodeForm } from '@/modules/user/components/passcode-form';
import { useCurrentUserProfile } from '@/modules/user/hooks/use-current-user-profile';
import { recalculateEstimatedAmounts } from '@/shared/lib/firestore/recalculate-estimated-amounts';
import { Switch } from '@/shared/components/ui/switch';
import {
  getVisibleMilestones,
  MilestoneForm,
  getMilestoneAnchorDate,
  milestoneService,
  useMilestones,
} from '@/modules/milestone';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import {
  TodoDetailView,
  TodoForm,
  TodoVendorForm,
  filterTodosByStatus,
  sortTodosByDueDate,
  useTodos,
  todoService,
} from '@/modules/todo';
import { PlanningTab } from '@/modules/planning';
import type { TodoDueSortOrder, TodoStatusFilter } from '@/modules/todo';
import type { TodoDocument } from '@/modules/todo/types/todo';
import { WeddingGuestPanel } from '@/modules/wedding-guest';
import {
  TravelActivityForm,
  TravelItineraryTab,
  travelActivityService,
  useTravelActivities,
} from '@/modules/travel-activity';
import type { TravelActivityDocument } from '@/modules/travel-activity';
import {
  DebtTrackingPanel,
  useDebtLedger,
  useDebtTracking,
  useDebtTransactions,
} from '@/modules/debt-tracking';
import type { MemberDebtSnapshot } from '@/modules/debt-tracking';
import { FinanceBudgetProgress } from '@/modules/statistic/components/finance-budget-progress';
import { FinanceCategoryDonut } from '@/modules/statistic/components/finance-category-donut';
import { FinanceMilestoneBars } from '@/modules/statistic/components/finance-milestone-bars';
import { FinanceSummaryHero } from '@/modules/statistic/components/finance-summary-hero';
import { MemberBalanceTable } from '@/modules/statistic/components/member-balance-table';
import { MemberSpendingList } from '@/modules/statistic/components/member-spending-list';
import { statisticService } from '@/modules/statistic/services';
import { SettlementList } from '@/modules/settlement/components/settlement-list';
import { SettlementSuggestionList } from '@/modules/settlement/components/settlement-suggestion-list';
import { useSettlements } from '@/modules/settlement/hooks/use-settlements';
import { settlementService } from '@/modules/settlement/services';
import type {
  SettlementDocument,
  SettlementSuggestion,
} from '@/modules/settlement/types/settlement';
import { getTodoBudgetAmount } from '@/modules/todo/utils/todo-budget';
import { Button } from '@/shared/components/ui/button';
import { BottomSheet } from '@/shared/components/ui/bottom-sheet';
import { Card } from '@/shared/components/ui/card';
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog';
import { ResponsiveModal } from '@/shared/components/ui/responsive-modal';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useMediaQuery } from '@/shared/hooks/use-media-query';
import { formatCompactCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import { cn } from '@/shared/utils/cn';

const tabIcons = {
  overview: LayoutDashboard,
  planning: Flag,
  finance: Clock,
  weddingGuests: Gift,
  members: Users,
  travelItinerary: Clock,
  debtTracking: BarChart3,
} as const;

function getMilestoneWorkSortTime(milestone: MilestoneDocument) {
  return getMilestoneAnchorDate(milestone)?.getTime() ?? 0;
}

type HeaderModal =
  'edit-plan' | 'plan-settings' | 'plan-lock' | 'leave-or-delete' | null;
type HeaderMenuItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  destructive?: boolean;
  onSelect: () => void;
};

const planStatusLabel: Record<PlanStatus, string> = {
  active: 'Đang diễn ra',
  completed: 'Hoàn thành',
  closed: 'Đã dừng',
  archived: 'Đã lưu trữ',
};

export default function PlanDetailPage() {
  const params = useParams<{ planId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = Array.isArray(params.planId)
    ? params.planId[0]
    : params.planId;
  const { user } = useAuthSession();
  const { plan, isLoading, errorMessage: planError } = usePlan(planId);
  const [activeTab, setActiveTab] = useState<keyof typeof tabIcons>('overview');
  const {
    milestones,
    isLoading: isMilestonesLoading,
    errorMessage: milestoneError,
  } = useMilestones(planId);
  const visibleMilestones = useMemo(
    () => getVisibleMilestones(milestones),
    [milestones],
  );
  const {
    todos,
    isLoading: isTodosLoading,
    errorMessage: todoError,
  } = useTodos(planId);
  const {
    members,
    currentMember,
    isOwner,
    hasCapability,
    errorMessage: memberError,
  } = usePlanMembers(planId);
  const { invitations, errorMessage: invitationError } =
    usePlanInvitations(planId);
  const planDetailTabs = useMemo(
    () => (plan ? getPlanDetailTabs(plan, currentMember) : []),
    [plan, currentMember],
  );
  const estimatedTotal = useMemo(
    () =>
      todos.reduce(
        (total, todo) => total + (getTodoBudgetAmount(todo) ?? 0),
        0,
      ),
    [todos],
  );
  const resolvedEstimatedTotal = useMemo(
    () => Math.max(plan?.estimatedAmount ?? 0, estimatedTotal),
    [estimatedTotal, plan?.estimatedAmount],
  );
  const effectiveEstimatedTotal = useMemo(
    () =>
      getEffectiveBudgetAmount(
        plan?.budgetAmount ?? null,
        resolvedEstimatedTotal,
      ),
    [plan?.budgetAmount, resolvedEstimatedTotal],
  );
  const estimatedByMilestoneId = useMemo(() => {
    const totals: Record<string, number> = {};

    for (const todo of todos) {
      totals[todo.milestoneId] =
        (totals[todo.milestoneId] ?? 0) + (getTodoBudgetAmount(todo) ?? 0);
    }

    return totals;
  }, [todos]);
  const categories = useMemo(
    () => (plan ? getExpenseCategories(plan.planType) : []),
    [plan],
  );
  const incomeCategories = useMemo(
    () => (plan ? getIncomeCategories(plan.planType) : []),
    [plan],
  );
  const isTravelItineraryEnabled = Boolean(
    plan && hasPlanModule(plan, 'travelItinerary'),
  );
  const isDebtTrackingEnabled = Boolean(
    plan && hasPlanModule(plan, 'debtTracking'),
  );
  const { expenses, errorMessage: expenseError } = useExpenses(planId);
  const { incomes, errorMessage: incomeError } = useIncomes(planId);
  const {
    activities: travelActivities,
    isLoading: isTravelActivitiesLoading,
    errorMessage: travelActivityError,
  } = useTravelActivities(planId, isTravelItineraryEnabled);
  const {
    aggregates: debtAggregates,
    snapshots: debtSnapshots,
    summary: debtTrackingSummary,
    isLoading: isDebtTrackingLoading,
    errorMessage: debtTrackingError,
  } = useDebtTracking({
    currentMemberId: currentMember?.id ?? null,
    enabled: isDebtTrackingEnabled,
    expenses,
    incomes,
  });
  const isNativeDebtPlan = Boolean(
    plan && resolvePlanDebtModel(plan) === 'native_debt',
  );
  const isWeddingPlan = plan?.planType === 'wedding';
  const spentLabel = isWeddingPlan ? 'Đã chi' : 'Tổng chi';
  const estimatedLabel = isWeddingPlan ? 'Dự kiến chi' : 'Dự kiến';
  const {
    transactions: debtTransactions,
    isLoading: isNativeDebtLoading,
    errorMessage: nativeDebtError,
  } = useDebtTransactions(planId, {
    enabled: isDebtTrackingEnabled && isNativeDebtPlan,
  });
  const {
    counterpartyLedgers: nativeDebtCounterpartyLedgers,
    planSummary: nativeDebtSummary,
  } = useDebtLedger(debtTransactions);
  const isPlanEnded = plan?.status === 'completed' || plan?.status === 'closed';
  const canManageMembers = hasCapability('members.manage');
  const canManageSettlements = hasCapability('finance.manageSettlements');
  const canEditAllExpenses = hasCapability('finance.editAllExpense');
  const canCreateExpense = hasCapability('finance.createExpense') && !isPlanEnded;
  const canManageTravelActivities =
    hasCapability('travelItinerary.createActivity') && !isPlanEnded;
  const canManageAllPlanning = hasCapability('planning.manageMilestone') && !isPlanEnded;
  const canManageOwnPlanning = hasCapability('planning.createTodo') && !isPlanEnded;
  const canManagePlanning = canManageAllPlanning;
  const { settlements, errorMessage: settlementWatchError } =
    useSettlements(planId);
  const [memberActionError, setMemberActionError] = useState<string | null>(
    null,
  );
  const [memberActionMessage, setMemberActionMessage] = useState<string | null>(
    null,
  );
  const [isMemberActionSubmitting, setIsMemberActionSubmitting] =
    useState(false);
  const [settlementError, setSettlementError] = useState<string | null>(null);
  const [settlementMessage, setSettlementMessage] = useState<string | null>(
    null,
  );
  const [isSettlementSubmitting, setIsSettlementSubmitting] = useState(false);
  const [closingError, setClosingError] = useState<string | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [archivingError, setArchivingError] = useState<string | null>(null);
  const [isClosingPlan, setIsClosingPlan] = useState(false);
  const [isCompletingPlan, setIsCompletingPlan] = useState(false);
  const [isArchivingPlan, setIsArchivingPlan] = useState(false);
  const [isPlanUnlocked, setIsPlanUnlocked] = useState(false);
  const [securityActionError, setSecurityActionError] = useState<string | null>(
    null,
  );
  const [isSecurityActionSubmitting, setIsSecurityActionSubmitting] =
    useState(false);
  const { plans: myPlanSummaries, isLoading: isUserPlansLoading } =
    useUserPlans();
  const { userProfile, isLoading: isUserProfileLoading } =
    useCurrentUserProfile();
  const [deletingError, setDeletingError] = useState<string | null>(null);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);
  const [showDeletePlanConfirm, setShowDeletePlanConfirm] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(
    null,
  );
  const [selectedTimelineMilestoneId, setSelectedTimelineMilestoneId] =
    useState<string | null>(null);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [editingMilestone, setEditingMilestone] =
    useState<MilestoneDocument | null>(null);
  const [isMilestoneSubmitting, setIsMilestoneSubmitting] = useState(false);
  const [milestoneActionError, setMilestoneActionError] = useState<
    string | null
  >(null);
  const [editingTodo, setEditingTodo] = useState<TodoDocument | null>(null);
  const [showTodoForm, setShowTodoForm] = useState(false);
  const [isTodoSubmitting, setIsTodoSubmitting] = useState(false);
  const [todoActionError, setTodoActionError] = useState<string | null>(null);
  const [vendorFormTodo, setVendorFormTodo] = useState<TodoDocument | null>(
    null,
  );
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [detailTodo, setDetailTodo] = useState<TodoDocument | null>(null);
  const [todoToRestoreAfterVendor, setTodoToRestoreAfterVendor] =
    useState<TodoDocument | null>(null);
  const [expenseSheetMilestoneId, setExpenseSheetMilestoneId] = useState<
    string | null
  >(null);
  const [detailExpense, setDetailExpense] = useState<ExpenseDocument | null>(
    null,
  );
  const [editingExpense, setEditingExpense] = useState<ExpenseDocument | null>(
    null,
  );
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseFormMilestoneId, setExpenseFormMilestoneId] = useState<
    string | null
  >(null);
  const [expenseFormActivityId, setExpenseFormActivityId] = useState<
    string | null
  >(null);
  const [isDeletingExpenseInline, setIsDeletingExpenseInline] = useState(false);
  const [expenseActionError, setExpenseActionError] = useState<string | null>(
    null,
  );
  const [detailIncome, setDetailIncome] = useState<IncomeDocument | null>(
    null,
  );
  const [editingIncome, setEditingIncome] = useState<IncomeDocument | null>(
    null,
  );
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [incomeFormMilestoneId, setIncomeFormMilestoneId] = useState<
    string | null
  >(null);
  const [isDeletingIncomeInline, setIsDeletingIncomeInline] = useState(false);
  const [incomeActionError, setIncomeActionError] = useState<string | null>(
    null,
  );
  const [desktopFinanceDetail, setDesktopFinanceDetail] =
    useState<FinanceDesktopDetail | null>(null);
  const [travelActionError, setTravelActionError] = useState<string | null>(
    null,
  );
  const [showTravelActivityForm, setShowTravelActivityForm] = useState(false);
  const [editingTravelActivity, setEditingTravelActivity] =
    useState<TravelActivityDocument | null>(null);
  const [detailTravelActivity, setDetailTravelActivity] =
    useState<TravelActivityDocument | null>(null);
  const [detailDebt, setDetailDebt] = useState<MemberDebtSnapshot | null>(null);
  const [workViewMode, setWorkViewMode] = useState<'milestones' | 'todos'>(
    'milestones',
  );
  const [milestoneSearchQuery, setMilestoneSearchQuery] = useState('');
  const [todoStatusFilter, setTodoStatusFilter] =
    useState<TodoStatusFilter>('pending');
  const [todoDueSortOrder, setTodoDueSortOrder] =
    useState<TodoDueSortOrder>('oldest');
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [headerModal, setHeaderModal] = useState<HeaderModal>(null);
  const [showClosePlanConfirm, setShowClosePlanConfirm] = useState(false);
  const [showCompletePlanConfirm, setShowCompletePlanConfirm] = useState(false);
  const [showArchivePlanConfirm, setShowArchivePlanConfirm] = useState(false);
  const [showStatisticSheet, setShowStatisticSheet] = useState(false);
  const [statisticMemberDrilldown, setStatisticMemberDrilldown] = useState<{
    memberId: string;
  } | null>(null);
  const [
    statisticMilestoneMemberDrilldown,
    setStatisticMilestoneMemberDrilldown,
  ] = useState<{
    milestoneId: string;
    memberId: string;
  } | null>(null);
  const previousPlanIdRef = useRef<string | undefined>(undefined);
  const hasRequestedEstimateRepairRef = useRef(false);
  const openPlanTab = (tabId: keyof typeof tabIcons) => {
    setActiveTab(tabId);

    const tabDefinition = planDetailTabs.find((tab) => tab.id === tabId);

    if (!tabDefinition) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams.toString());

    if (tabDefinition.queryTab) {
      nextSearchParams.set('tab', tabDefinition.queryTab);
    } else {
      nextSearchParams.delete('tab');
    }

    if (tabDefinition.id !== 'finance') {
      nextSearchParams.delete('milestoneId');
    }

    const nextSearch = nextSearchParams.toString();
    router.replace(
      nextSearch ? `/plans/${planId}?${nextSearch}` : `/plans/${planId}`,
    );
  };

  useEffect(() => {
    if (!plan) {
      hasRequestedEstimateRepairRef.current = false;
      return;
    }

    const storedEstimatedAmount = plan.estimatedAmount ?? 0;
    const shouldRepair =
      storedEstimatedAmount < 0 || storedEstimatedAmount < estimatedTotal;

    if (!shouldRepair || hasRequestedEstimateRepairRef.current) {
      return;
    }

    hasRequestedEstimateRepairRef.current = true;
    void recalculateEstimatedAmounts(plan.id);
  }, [estimatedTotal, plan]);

  useEffect(() => {
    if (!plan) {
      return;
    }

    const tabParam = searchParams.get('tab');
    const isNewPlan =
      previousPlanIdRef.current !== undefined &&
      previousPlanIdRef.current !== planId;
    previousPlanIdRef.current = planId;

    if (tabParam === 'settings') {
      setHeaderModal('plan-settings');
    } else if (tabParam) {
      setActiveTab(resolvePlanDetailTab(plan, tabParam, currentMember));
      if (tabParam === 'statistic') {
        setShowStatisticSheet(true);
      }
    } else if (isNewPlan) {
      setActiveTab(resolvePlanDetailTab(plan, null, currentMember));
    }
  }, [plan, planId, searchParams, currentMember]);

  const currentPlan = plan;
  const statistic = useMemo(
    () =>
      statisticService.calculate({
        members,
        expenses,
        incomes,
        milestones: visibleMilestones,
        categories,
        settlements,
      }),
    [members, expenses, incomes, visibleMilestones, categories, settlements],
  );
  const suggestions = settlementService.suggest(statistic.memberBalances);
  const statisticMemberDrilldownMember = useMemo(
    () =>
      statisticMemberDrilldown
        ? (members.find(
            (member) => member.id === statisticMemberDrilldown.memberId,
          ) ?? null)
        : null,
    [statisticMemberDrilldown, members],
  );
  const statisticMemberDrilldownExpenses = useMemo(
    () =>
      statisticMemberDrilldownMember
        ? expenses
            .filter(
              (expense) =>
                expense.paidByMemberId === statisticMemberDrilldownMember.id,
            )
            .sort((a, b) => b.spentAt.toMillis() - a.spentAt.toMillis())
        : [],
    [statisticMemberDrilldownMember, expenses],
  );
  const statisticMilestoneMemberDrilldownMilestone = useMemo(
    () =>
      statisticMilestoneMemberDrilldown
        ? (visibleMilestones.find(
            (milestone) =>
              milestone.id === statisticMilestoneMemberDrilldown.milestoneId,
          ) ?? null)
        : null,
    [statisticMilestoneMemberDrilldown, visibleMilestones],
  );
  const statisticMilestoneMemberDrilldownMember = useMemo(
    () =>
      statisticMilestoneMemberDrilldown
        ? (members.find(
            (member) =>
              member.id === statisticMilestoneMemberDrilldown.memberId,
          ) ?? null)
        : null,
    [statisticMilestoneMemberDrilldown, members],
  );
  const statisticMilestoneMemberDrilldownExpenses = useMemo(
    () =>
      statisticMilestoneMemberDrilldownMilestone &&
      statisticMilestoneMemberDrilldownMember
        ? expenses
            .filter(
              (expense) =>
                expense.milestoneId ===
                  statisticMilestoneMemberDrilldownMilestone.id &&
                expense.paidByMemberId ===
                  statisticMilestoneMemberDrilldownMember.id,
            )
            .sort((a, b) => b.spentAt.toMillis() - a.spentAt.toMillis())
        : [],
    [
      statisticMilestoneMemberDrilldownMilestone,
      statisticMilestoneMemberDrilldownMember,
      expenses,
    ],
  );
  const activeMembers = members.filter((member) => member.status === 'active');
  const linkedMemberIds = buildLinkedMemberIdSet({
    expenses,
    incomes,
    settlements,
  });
  const sortedWorkMilestones = useMemo(
    () =>
      [...visibleMilestones].sort((a, b) => {
        const timeDifference =
          getMilestoneWorkSortTime(a) - getMilestoneWorkSortTime(b);

        if (timeDifference !== 0) {
          return timeDifference;
        }

        return a.orderIndex - b.orderIndex;
      }),
    [visibleMilestones],
  );
  const defaultWorkMilestone = useMemo(() => {
    const eligible = sortedWorkMilestones.filter(
      (milestone) =>
        milestone.status === 'in_progress' || milestone.status === 'upcoming',
    );

    return eligible[0] ?? sortedWorkMilestones[0] ?? null;
  }, [sortedWorkMilestones]);
  const selectedMilestone = useMemo(
    () =>
      sortedWorkMilestones.find(
        (milestone) => milestone.id === selectedMilestoneId,
      ) ?? defaultWorkMilestone,
    [selectedMilestoneId, sortedWorkMilestones, defaultWorkMilestone],
  );
  const expenseSheetMilestone = useMemo(
    () =>
      visibleMilestones.find(
        (milestone) => milestone.id === expenseSheetMilestoneId,
      ) ?? null,
    [expenseSheetMilestoneId, visibleMilestones],
  );
  const expenseSheetMilestoneExpenses = useMemo(
    () =>
      expenseSheetMilestone
        ? expenses
            .filter(
              (expense) => expense.milestoneId === expenseSheetMilestone.id,
            )
            .sort((a, b) => b.spentAt.toMillis() - a.spentAt.toMillis())
        : [],
    [expenseSheetMilestone, expenses],
  );
  const isDesktopViewport = useMediaQuery('(min-width: 1024px)');
  const upcomingMilestones = useMemo(() => {
    return visibleMilestones
      .filter(
        (milestone) =>
          milestone.status === 'in_progress' || milestone.status === 'upcoming',
      )
      .sort((a, b) => getMilestoneWorkSortTime(a) - getMilestoneWorkSortTime(b))
      .slice(0, isDesktopViewport ? 3 : 2);
  }, [visibleMilestones, isDesktopViewport]);
  const upcomingTodos = useMemo(() => {
    return todos
      .filter(
        (todo) =>
          todo.status !== 'done' && todo.status !== 'cancelled' && todo.dueDate,
      )
      .sort((a, b) => a.dueDate!.toMillis() - b.dueDate!.toMillis())
      .slice(0, 5);
  }, [todos]);
  const endedPlanDate = useMemo(
    () =>
      timestampToDate(plan?.endDate ?? null) ??
      (plan?.status === 'closed'
        ? timestampToDate(plan.closedAt)
        : timestampToDate(plan?.updatedAt ?? null)),
    [plan],
  );
  const allTodosFilteredAndSorted = useMemo(
    () =>
      sortTodosByDueDate(
        filterTodosByStatus(todos, todoStatusFilter),
        todoDueSortOrder,
      ),
    [todos, todoStatusFilter, todoDueSortOrder],
  );

  useEffect(() => {
    const milestoneIdParam = searchParams.get('milestoneId');

    if (
      milestoneIdParam &&
      visibleMilestones.some((milestone) => milestone.id === milestoneIdParam)
    ) {
      setSelectedTimelineMilestoneId(milestoneIdParam);
    }
  }, [visibleMilestones, searchParams]);

  useEffect(() => {
    const todoIdParam = searchParams.get('todoId');

    if (!todoIdParam) {
      return;
    }

    const matchedTodo = todos.find((todo) => todo.id === todoIdParam);

    if (!matchedTodo) {
      return;
    }

    setActiveTab('planning');
    setWorkViewMode('todos');
    setSelectedMilestoneId(matchedTodo.milestoneId);
    setDetailTodo((current) =>
      current?.id === matchedTodo.id ? current : matchedTodo,
    );

    // Deep link chỉ nên kích hoạt 1 lần — xoá `todoId` khỏi URL ngay sau khi đã mở, nếu
    // không thì mỗi khi `todos` đổi reference (ví dụ Firestore emit lại snapshot), effect
    // này chạy lại và tự chuyển tab/mở lại popup, ghi đè cả khi user đã tự chuyển tab khác.
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete('todoId');
    const nextSearch = nextSearchParams.toString();
    router.replace(
      nextSearch ? `/plans/${planId}?${nextSearch}` : `/plans/${planId}`,
    );
  }, [searchParams, todos, planId, router]);

  useEffect(() => {
    const activityIdParam = searchParams.get('activityId');

    if (!activityIdParam || !isTravelItineraryEnabled) {
      return;
    }

    const matchedActivity = travelActivities.find(
      (activity) => activity.id === activityIdParam,
    );

    if (!matchedActivity) {
      return;
    }

    setActiveTab('travelItinerary');
    setDetailTravelActivity((current) =>
      current?.id === matchedActivity.id ? current : matchedActivity,
    );
  }, [isTravelItineraryEnabled, searchParams, travelActivities]);

  useEffect(() => {
    if (!selectedMilestoneId && defaultWorkMilestone) {
      setSelectedMilestoneId(defaultWorkMilestone.id);
      return;
    }

    if (
      selectedMilestoneId &&
      !sortedWorkMilestones.some(
        (milestone) => milestone.id === selectedMilestoneId,
      )
    ) {
      setSelectedMilestoneId(defaultWorkMilestone?.id ?? null);
    }
  }, [selectedMilestoneId, sortedWorkMilestones, defaultWorkMilestone]);

  useEffect(() => {
    if (
      selectedTimelineMilestoneId &&
      !visibleMilestones.some(
        (milestone) => milestone.id === selectedTimelineMilestoneId,
      )
    ) {
      setSelectedTimelineMilestoneId(null);
    }
  }, [visibleMilestones, selectedTimelineMilestoneId]);

  useEffect(() => {
    if (!detailTodo) {
      return;
    }

    const nextTodo = todos.find((todo) => todo.id === detailTodo.id) ?? null;

    if (!nextTodo) {
      setDetailTodo(null);
      return;
    }

    if (nextTodo !== detailTodo) {
      setDetailTodo(nextTodo);
    }
  }, [detailTodo, todos]);

  useEffect(() => {
    if (!detailTravelActivity) {
      return;
    }

    const nextActivity =
      travelActivities.find(
        (activity) => activity.id === detailTravelActivity.id,
      ) ?? null;

    if (!nextActivity) {
      setDetailTravelActivity(null);
      return;
    }

    if (nextActivity !== detailTravelActivity) {
      setDetailTravelActivity(nextActivity);
    }
  }, [detailTravelActivity, travelActivities]);

  useEffect(() => {
    if (!detailDebt) {
      return;
    }

    const nextDebt =
      debtSnapshots.find(
        (snapshot) => snapshot.memberId === detailDebt.memberId,
      ) ?? null;

    if (!nextDebt) {
      setDetailDebt(null);
      return;
    }

    if (nextDebt !== detailDebt) {
      setDetailDebt(nextDebt);
    }
  }, [debtSnapshots, detailDebt]);

  useEffect(() => {
    if (!todoToRestoreAfterVendor) {
      return;
    }

    const nextTodo =
      todos.find((todo) => todo.id === todoToRestoreAfterVendor.id) ?? null;

    if (nextTodo !== todoToRestoreAfterVendor) {
      setTodoToRestoreAfterVendor(nextTodo);
    }
  }, [todoToRestoreAfterVendor, todos]);

  if (!planId) {
    notFound();
  }

  if (isLoading || isUserPlansLoading || isUserProfileLoading) {
    return (
      <main className="flex flex-col gap-5">
        <Skeleton className="h-44 rounded-[32px]" />
        <Skeleton className="h-16 rounded-[28px]" />
        <Skeleton className="h-52 rounded-[28px]" />
      </main>
    );
  }

  if (!currentPlan) {
    notFound();
  }

  const ensuredPlan = currentPlan;
  const mySummary = myPlanSummaries.find(
    (summary) => summary.planId === planId,
  );
  const isPlanSecuredForMe = Boolean(
    mySummary?.isLocked && userProfile?.secretNumberHash,
  );

  async function handleDeleteTravelActivity(activity: TravelActivityDocument) {
    if (!user) {
      return;
    }

    const shouldDelete = window.confirm(
      `Xóa hoạt động "${activity.title}" khỏi itinerary?`,
    );

    if (!shouldDelete) {
      return;
    }

    setTravelActionError(null);

    try {
      await travelActivityService.deleteActivity(
        ensuredPlan,
        activity.id,
        user,
        currentMember,
      );

      if (detailTravelActivity?.id === activity.id) {
        setDetailTravelActivity(null);
      }
    } catch (error) {
      setTravelActionError(
        error instanceof Error
          ? error.message
          : 'Không thể xóa hoạt động lịch trình.',
      );
    }
  }

  if (isPlanSecuredForMe && userProfile?.secretNumberHash && !isPlanUnlocked) {
    return (
      <PlanUnlockGate
        onUnlock={() => setIsPlanUnlocked(true)}
        secretNumberHash={userProfile.secretNumberHash}
      />
    );
  }

  async function handleUpdateMember(
    member: PlanMemberDocument,
    values: {
      nickname: string;
      role: Exclude<PlanRole, 'owner'>;
      moduleAccess: Partial<Record<ConfigurableModuleId, ModuleAccessLevel>>;
    },
  ) {
    if (!user) {
      return;
    }

    setIsMemberActionSubmitting(true);
    setMemberActionError(null);
    setMemberActionMessage(null);

    try {
      await memberService.updateMember(
        planId,
        {
          memberId: member.id,
          nickname: values.nickname,
          role: values.role,
          moduleAccess: values.moduleAccess,
        },
        user,
        currentMember,
      );
      setMemberActionMessage('Đã cập nhật thành viên.');
    } catch (error) {
      setMemberActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể cập nhật thành viên.',
      );
    } finally {
      setIsMemberActionSubmitting(false);
    }
  }

  async function handleUpdateMemberAvatar(
    member: PlanMemberDocument,
    avatarUrl: string | null,
  ) {
    if (!user) {
      return;
    }

    setIsMemberActionSubmitting(true);
    setMemberActionError(null);
    setMemberActionMessage(null);

    try {
      await memberService.updateMemberAvatar(
        planId,
        {
          memberId: member.id,
          avatarUrl,
        },
        user,
        currentMember,
      );
      setMemberActionMessage('Đã cập nhật avatar thành viên.');
    } catch (error) {
      setMemberActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể cập nhật avatar thành viên.',
      );
    } finally {
      setIsMemberActionSubmitting(false);
    }
  }

  async function handleRemoveMember(member: PlanMemberDocument) {
    if (!user) {
      return;
    }

    setIsMemberActionSubmitting(true);
    setMemberActionError(null);
    setMemberActionMessage(null);

    try {
      await memberService.removeMember(planId, member, user, currentMember);
      setMemberActionMessage('Đã ngừng hoạt động thành viên.');
    } catch (error) {
      setMemberActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể ngừng hoạt động thành viên.',
      );
    } finally {
      setIsMemberActionSubmitting(false);
    }
  }

  async function handleReactivateMember(member: PlanMemberDocument) {
    if (!user) {
      return;
    }

    setIsMemberActionSubmitting(true);
    setMemberActionError(null);
    setMemberActionMessage(null);

    try {
      await memberService.reactivateMember(planId, member, user, currentMember);
      setMemberActionMessage('Đã kích hoạt lại thành viên.');
    } catch (error) {
      setMemberActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể kích hoạt lại thành viên.',
      );
    } finally {
      setIsMemberActionSubmitting(false);
    }
  }

  async function handleDeleteMember(member: PlanMemberDocument) {
    if (!user) {
      return;
    }

    setIsMemberActionSubmitting(true);
    setMemberActionError(null);
    setMemberActionMessage(null);

    try {
      await memberService.deleteMember(planId, member, user, currentMember, {
        hasLinkedRecords: linkedMemberIds.has(member.id),
      });
      setMemberActionMessage('Đã xóa thành viên.');
    } catch (error) {
      setMemberActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể xóa thành viên.',
      );
    } finally {
      setIsMemberActionSubmitting(false);
    }
  }

  async function handleUnlinkAccount(member: PlanMemberDocument) {
    setIsMemberActionSubmitting(true);
    setMemberActionError(null);
    setMemberActionMessage(null);

    try {
      await memberService.unlinkMemberAccount(planId, member, currentMember);
      setMemberActionMessage('Đã gỡ liên kết tài khoản.');
    } catch (error) {
      setMemberActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể gỡ liên kết tài khoản này.',
      );
    } finally {
      setIsMemberActionSubmitting(false);
    }
  }

  async function handleCreateClaimInvitation(
    member: PlanMemberDocument,
    email: string | null,
  ) {
    if (!user) {
      throw new Error('Hiện chưa thể tạo link liên kết.');
    }

    return invitationService.createClaimInvitation(
      ensuredPlan,
      member,
      email,
      user,
      currentMember,
    );
  }

  async function handleRevokeInvitation(invitation: InvitationDocument) {
    if (!user) {
      return;
    }

    setIsMemberActionSubmitting(true);
    setMemberActionError(null);
    setMemberActionMessage(null);

    try {
      await invitationService.revokeInvitation(
        planId,
        invitation.id,
        user,
        currentMember,
      );
      setMemberActionMessage('Đã hủy lời mời.');
    } catch (error) {
      setMemberActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể hủy lời mời này.',
      );
    } finally {
      setIsMemberActionSubmitting(false);
    }
  }

  async function handleConfirmSettlement(suggestion: SettlementSuggestion) {
    if (!user) {
      return;
    }

    setIsSettlementSubmitting(true);
    setSettlementError(null);
    setSettlementMessage(null);

    try {
      await settlementService.confirm(suggestion, {
        plan: ensuredPlan,
        members,
        currentMember,
        currentUser: user,
      });
      setSettlementMessage('Đã lưu đối soát thành công.');
    } catch (error) {
      setSettlementError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể lưu đối soát này.',
      );
    } finally {
      setIsSettlementSubmitting(false);
    }
  }

  async function handleCancelSettlement(settlement: SettlementDocument) {
    if (!user) {
      return;
    }

    setIsSettlementSubmitting(true);
    setSettlementError(null);
    setSettlementMessage(null);

    try {
      await settlementService.cancel(
        ensuredPlan,
        settlement,
        user,
        currentMember,
      );
      setSettlementMessage('Đã hủy đối soát.');
    } catch (error) {
      setSettlementError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể hủy đối soát này.',
      );
    } finally {
      setIsSettlementSubmitting(false);
    }
  }

  async function handleClosePlan() {
    setIsClosingPlan(true);
    setClosingError(null);

    try {
      await planService.closePlan(ensuredPlan, currentMember);
      setShowClosePlanConfirm(false);
    } catch (error) {
      setClosingError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể đóng kế hoạch này.',
      );
    } finally {
      setIsClosingPlan(false);
    }
  }

  async function handleArchivePlan() {
    setIsArchivingPlan(true);
    setArchivingError(null);

    try {
      await planService.archivePlan(ensuredPlan, currentMember);
      setShowArchivePlanConfirm(false);
      router.replace('/plans');
    } catch (error) {
      setArchivingError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể lưu trữ kế hoạch này.',
      );
    } finally {
      setIsArchivingPlan(false);
    }
  }

  async function handleCompletePlan() {
    setIsCompletingPlan(true);
    setCompletionError(null);

    try {
      await planService.completePlan(ensuredPlan, currentMember);
      setShowCompletePlanConfirm(false);
    } catch (error) {
      setCompletionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể hoàn thành kế hoạch này.',
      );
    } finally {
      setIsCompletingPlan(false);
    }
  }

  async function handlePasscodeCreated() {
    if (!user) {
      return;
    }

    setSecurityActionError(null);
    setIsSecurityActionSubmitting(true);

    try {
      await planService.setPlanSecurity(user.uid, planId, true);
      setHeaderModal('plan-settings');
    } catch (error) {
      setSecurityActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể cập nhật khóa cá nhân cho kế hoạch này.',
      );
    } finally {
      setIsSecurityActionSubmitting(false);
    }
  }

  async function handleToggleSecurity(nextEnabled: boolean) {
    if (!user) {
      return;
    }

    if (nextEnabled && !userProfile?.secretNumberHash) {
      setHeaderModal('plan-lock');
      return;
    }

    setSecurityActionError(null);
    setIsSecurityActionSubmitting(true);

    try {
      await planService.setPlanSecurity(user.uid, planId, nextEnabled);
    } catch (error) {
      setSecurityActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể cập nhật khóa cá nhân cho kế hoạch này.',
      );
    } finally {
      setIsSecurityActionSubmitting(false);
    }
  }

  async function handleDeletePlan() {
    setIsDeletingPlan(true);
    setDeletingError(null);

    try {
      await planService.deletePlan(ensuredPlan, currentMember);
      router.replace('/plans');
    } catch (error) {
      setDeletingError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể xóa kế hoạch này.',
      );
      setIsDeletingPlan(false);
    }
  }

  async function handleDeleteMilestone(milestone: MilestoneDocument) {
    if (!user) {
      return;
    }

    const confirmed = window.confirm(
      `Xoá mốc "${milestone.title}"? Toàn bộ công việc thuộc mốc này sẽ bị xoá theo. Hành động này không thể hoàn tác.`,
    );

    if (!confirmed) {
      return;
    }

    setIsMilestoneSubmitting(true);
    setMilestoneActionError(null);

    try {
      await milestoneService.deleteMilestone(
        ensuredPlan,
        milestone,
        user,
        currentMember,
      );
    } catch (error) {
      setMilestoneActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể xoá mốc kế hoạch này.',
      );
    } finally {
      setIsMilestoneSubmitting(false);
    }
  }

  async function handleChangeTodoStatus(
    todo: TodoDocument,
    status: TodoDocument['status'],
  ) {
    if (!user) {
      return;
    }

    setIsTodoSubmitting(true);
    setTodoActionError(null);

    try {
      await todoService.updateTodo(
        ensuredPlan,
        todo,
        {
          todoId: todo.id,
          milestoneId: todo.milestoneId,
          title: todo.title,
          description: todo.description || '',
          assigneeMemberId: todo.assigneeMemberId || '',
          dueDate: todo.dueDate
            ? new Date(todo.dueDate.toDate()).toISOString().slice(0, 10)
            : '',
          priority: todo.priority,
          status,
          budget: todo.budget ?? undefined,
          selectedTodoVendorId: todo.selectedTodoVendorId || undefined,
        },
        user,
        currentMember,
      );
    } catch (error) {
      setTodoActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể cập nhật trạng thái công việc.',
      );
    } finally {
      setIsTodoSubmitting(false);
    }
  }

  function closeVendorForm() {
    setVendorFormTodo(null);
    setEditingVendorId(null);
    setDetailTodo(todoToRestoreAfterVendor);
    setTodoToRestoreAfterVendor(null);
  }

  const editingVendor = vendorFormTodo?.vendors.find(
    (vendor) => vendor.id === editingVendorId,
  );

  async function handleSelectTodoVendor(todo: TodoDocument, vendorId: string) {
    if (!user) {
      return;
    }

    setIsTodoSubmitting(true);
    setTodoActionError(null);

    try {
      await todoService.selectVendor(
        ensuredPlan,
        todo,
        todo.selectedTodoVendorId === vendorId ? null : vendorId,
        user,
        currentMember,
      );
    } catch (error) {
      setTodoActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể chọn nhà cung cấp này.',
      );
    } finally {
      setIsTodoSubmitting(false);
    }
  }

  async function handleDeleteVendor(todo: TodoDocument, vendorId: string) {
    if (!user) {
      return;
    }

    const vendor = todo.vendors.find((item) => item.id === vendorId);
    const confirmed = window.confirm(
      `Xoá nhà cung cấp "${vendor?.name ?? ''}"? Hành động này không thể hoàn tác.`,
    );

    if (!confirmed) {
      return;
    }

    setIsTodoSubmitting(true);
    setTodoActionError(null);

    try {
      await todoService.deleteVendor(
        ensuredPlan,
        todo,
        vendorId,
        user,
        currentMember,
      );
    } catch (error) {
      setTodoActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể xoá nhà cung cấp này.',
      );
    } finally {
      setIsTodoSubmitting(false);
    }
  }

  async function handleMoveTodoToMilestone(
    todo: TodoDocument,
    targetMilestoneId: string,
  ) {
    if (!user || !targetMilestoneId || todo.milestoneId === targetMilestoneId) {
      return;
    }

    setIsTodoSubmitting(true);
    setTodoActionError(null);

    try {
      await todoService.moveTodoToMilestone(
        ensuredPlan,
        {
          todoId: todo.id,
          targetMilestoneId,
        },
        user,
        currentMember,
      );
      setSelectedMilestoneId(targetMilestoneId);
    } catch (error) {
      setTodoActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể chuyển công việc sang milestone khác.',
      );
    } finally {
      setIsTodoSubmitting(false);
    }
  }

  async function handleReorderTodosWithinMilestone(
    milestoneId: string,
    orderedTodoIds: string[],
  ) {
    if (!user || orderedTodoIds.length === 0) {
      return;
    }

    setIsTodoSubmitting(true);
    setTodoActionError(null);

    try {
      await todoService.reorderTodosWithinMilestone(
        ensuredPlan,
        {
          milestoneId,
          orderedTodoIds,
        },
        user,
        currentMember,
      );
    } catch (error) {
      setTodoActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể sắp xếp lại công việc.',
      );
      throw error;
    } finally {
      setIsTodoSubmitting(false);
    }
  }

  async function handleDeleteTodo(todo: TodoDocument) {
    if (!user) {
      return;
    }

    const confirmed = window.confirm(
      `Xóa công việc "${todo.title}"? Hành động này không thể hoàn tác.`,
    );

    if (!confirmed) {
      return;
    }

    setIsTodoSubmitting(true);
    setTodoActionError(null);

    try {
      await todoService.deleteTodo(ensuredPlan, todo, user, currentMember);
    } catch (error) {
      setTodoActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể xóa công việc này.',
      );
    } finally {
      setIsTodoSubmitting(false);
    }
  }

  function openCreateExpense(milestoneId: string, activityId?: string) {
    setEditingExpense(null);
    setExpenseFormMilestoneId(milestoneId);
    setExpenseFormActivityId(activityId ?? null);
    setShowExpenseForm(true);
  }

  function openEditExpense(expense: ExpenseDocument) {
    setDetailExpense(null);
    setDesktopFinanceDetail(null);
    setEditingExpense(expense);
    setExpenseFormMilestoneId(expense.milestoneId);
    setShowExpenseForm(true);
  }

  function closeExpenseForm() {
    setShowExpenseForm(false);
    setEditingExpense(null);
    setExpenseFormMilestoneId(null);
    setExpenseFormActivityId(null);
  }

  async function handleDeleteExpenseInline(expense: ExpenseDocument) {
    if (!user) {
      return;
    }

    const confirmed = window.confirm(
      `Xoá khoản chi "${expense.title}"? Hành động này không thể hoàn tác.`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeletingExpenseInline(true);
    setExpenseActionError(null);

    try {
      await expenseService.deleteExpense(
        ensuredPlan,
        expense,
        user,
        currentMember,
      );
      setDetailExpense(null);
      setDesktopFinanceDetail(null);
    } catch (error) {
      setExpenseActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể xoá khoản chi này.',
      );
    } finally {
      setIsDeletingExpenseInline(false);
    }
  }

  function openCreateIncome(milestoneId: string) {
    setEditingIncome(null);
    setIncomeFormMilestoneId(milestoneId);
    setShowIncomeForm(true);
  }

  function openEditIncome(income: IncomeDocument) {
    setDetailIncome(null);
    setDesktopFinanceDetail(null);
    setEditingIncome(income);
    setIncomeFormMilestoneId(income.milestoneId);
    setShowIncomeForm(true);
  }

  function closeIncomeForm() {
    setShowIncomeForm(false);
    setEditingIncome(null);
    setIncomeFormMilestoneId(null);
  }

  async function handleDeleteIncomeInline(income: IncomeDocument) {
    if (!user) {
      return;
    }

    const confirmed = window.confirm(
      `Xoá khoản thu "${income.title}"? Hành động này không thể hoàn tác.`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeletingIncomeInline(true);
    setIncomeActionError(null);

    try {
      await incomeService.deleteIncome(ensuredPlan, income, user, currentMember);
      setDetailIncome(null);
      setDesktopFinanceDetail(null);
    } catch (error) {
      setIncomeActionError(
        error instanceof Error
          ? error.message
          : 'Hiện chưa thể xoá khoản thu này.',
      );
    } finally {
      setIsDeletingIncomeInline(false);
    }
  }

  function getExpenseDetailPermissions(expense: ExpenseDocument) {
    return {
      canEdit:
        canEditAllExpenses ||
        (hasPlanCapability(currentMember, 'finance.editOwnExpense') &&
          expense.createdByUserId === user?.uid),
      canDelete:
        hasPlanCapability(currentMember, 'finance.deleteAllExpense') ||
        (hasPlanCapability(currentMember, 'finance.deleteOwnExpense') &&
          expense.createdByUserId === user?.uid),
    };
  }

  function getIncomeDetailPermissions(income: IncomeDocument) {
    return {
      canEdit:
        hasPlanCapability(currentMember, 'finance.editOwnIncome') &&
        income.createdByMemberId === currentMember?.id,
      canDelete:
        hasPlanCapability(currentMember, 'finance.deleteOwnIncome') &&
        income.createdByMemberId === currentMember?.id,
    };
  }

  const headerMenuItems: HeaderMenuItem[] = [
    isOwner
      ? {
          key: 'edit-plan',
          label: 'Chỉnh sửa kế hoạch',
          icon: PencilLine,
          onSelect: () => {
            setShowHeaderMenu(false);
            setHeaderModal('edit-plan');
          },
        }
      : null,
    {
      key: 'manage-members',
      label: 'Quản lý thành viên',
      icon: Users,
      onSelect: () => {
        setShowHeaderMenu(false);
        openPlanTab('members');
      },
    },
    {
      key: 'plan-settings',
      label: 'Cài đặt kế hoạch',
      icon: Settings,
      onSelect: () => {
        setShowHeaderMenu(false);
        setHeaderModal('plan-settings');
      },
    },
    {
      key: 'leave-or-delete',
      label: isOwner ? 'Xóa kế hoạch' : 'Rời kế hoạch',
      icon: isOwner ? Trash2 : LogOut,
      destructive: true,
      onSelect: () => {
        setShowHeaderMenu(false);
        setHeaderModal('leave-or-delete');
      },
    },
  ].filter((item): item is HeaderMenuItem => item !== null);

  const activeTabContent = (() => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            canManagePlanning={canManagePlanning}
            currentMember={currentMember}
            debtTrackingError={debtTrackingError}
            debtTrackingSummary={debtTrackingSummary}
            endedPlanDate={endedPlanDate}
            estimatedByMilestoneId={estimatedByMilestoneId}
            isDebtTrackingEnabled={isDebtTrackingEnabled}
            isDebtTrackingLoading={isDebtTrackingLoading}
            isNativeDebtLoading={isNativeDebtLoading}
            nativeDebtError={nativeDebtError}
            nativeDebtSummary={nativeDebtSummary}
            nativeDebtCounterpartyLedgers={nativeDebtCounterpartyLedgers}
            nativeDebtTransactions={debtTransactions}
            isMilestonesLoading={isMilestonesLoading}
            isPlanEnded={Boolean(isPlanEnded)}
            isTodosLoading={isTodosLoading}
            isTravelActivitiesLoading={isTravelActivitiesLoading}
            isTravelItineraryEnabled={isTravelItineraryEnabled}
            members={members}
            milestoneActionError={milestoneActionError}
            onOpenPlanningMilestones={() => {
              setWorkViewMode('milestones');
              openPlanTab('planning');
            }}
            onOpenPlanningTodos={() => openPlanTab('planning')}
            onOpenDebtTracking={() => openPlanTab('debtTracking')}
            onOpenWeddingGuests={() => openPlanTab('weddingGuests')}
            onOpenFinance={() => openPlanTab('finance')}
            onOpenTravelItinerary={() => openPlanTab('travelItinerary')}
            onSelectMemberDrilldown={(memberId) =>
              setStatisticMemberDrilldown({ memberId })
            }
            onSelectMilestoneDrilldown={(milestoneId, memberId) =>
              setStatisticMilestoneMemberDrilldown({ milestoneId, memberId })
            }
            onSelectUpcomingMilestone={(milestoneId) => {
              setSelectedMilestoneId(milestoneId);
              setWorkViewMode('milestones');
              openPlanTab('planning');
            }}
            onViewTodo={setDetailTodo}
            plan={plan}
            planId={planId}
            planStatus={plan.status}
            selectedMilestoneId={selectedMilestone?.id ?? null}
            statistic={statistic}
            estimatedTotal={effectiveEstimatedTotal}
            todos={todos}
            todoActionError={todoActionError}
            travelActivities={travelActivities}
            travelActivityError={travelActivityError}
            upcomingMilestones={upcomingMilestones}
            upcomingTodos={upcomingTodos}
            visibleMilestones={visibleMilestones}
          />
        );
      case 'finance':
        return (
          <FinanceTab
            categories={[...categories, ...incomeCategories]}
            desktopDetail={desktopFinanceDetail}
            desktopDetailError={
              desktopFinanceDetail?.kind === 'income' ? incomeActionError : expenseActionError
            }
            errorMessage={expenseActionError}
            expenses={expenses}
            incomes={incomes}
            isDeletingDesktopDetail={
              desktopFinanceDetail?.kind === 'income'
                ? isDeletingIncomeInline
                : isDeletingExpenseInline
            }
            isPlanEnded={Boolean(isPlanEnded)}
            members={members}
            milestones={visibleMilestones}
            onCloseDesktopDetail={() => setDesktopFinanceDetail(null)}
            onDeleteDesktopDetail={() => {
              if (!desktopFinanceDetail) {
                return;
              }

              if (desktopFinanceDetail.kind === 'expense') {
                void handleDeleteExpenseInline(desktopFinanceDetail.expense);
              } else {
                void handleDeleteIncomeInline(desktopFinanceDetail.income);
              }
            }}
            onEditDesktopDetail={() => {
              if (!desktopFinanceDetail) {
                return;
              }

              if (desktopFinanceDetail.kind === 'expense') {
                openEditExpense(desktopFinanceDetail.expense);
              } else {
                openEditIncome(desktopFinanceDetail.income);
              }
            }}
            onOpenCreateExpense={openCreateExpense}
            onOpenCreateIncome={openCreateIncome}
            onOpenStatistic={() => setShowStatisticSheet(true)}
            onSelectExpense={(expense) => {
              if (isDesktopViewport) {
                setDesktopFinanceDetail({
                  kind: 'expense',
                  expense,
                  ...getExpenseDetailPermissions(expense),
                });
              } else {
                setDetailExpense(expense);
              }
            }}
            onSelectIncome={(income) => {
              if (isDesktopViewport) {
                setDesktopFinanceDetail({
                  kind: 'income',
                  income,
                  ...getIncomeDetailPermissions(income),
                });
              } else {
                setDetailIncome(income);
              }
            }}
            onSelectedMilestoneChange={setSelectedTimelineMilestoneId}
            plan={ensuredPlan}
            planId={planId}
            selectedMilestoneId={selectedTimelineMilestoneId}
            travelActivities={travelActivities}
          />
        );
      case 'planning':
        return (
          <>
            <PlanningTab
              allTodosFilteredAndSorted={allTodosFilteredAndSorted}
              canManageAllPlanning={canManageAllPlanning}
              canManageOwnPlanning={canManageOwnPlanning}
              categories={categories}
              errorMessage={null}
              expenseSheetMilestone={expenseSheetMilestone}
              expenseSheetMilestoneExpenses={expenseSheetMilestoneExpenses}
              incomeCategories={incomeCategories}
              isMilestoneSubmitting={isMilestoneSubmitting}
              isMilestonesLoading={isMilestonesLoading}
              isPlanEnded={Boolean(isPlanEnded)}
              isTodoSubmitting={isTodoSubmitting}
              isTodosLoading={isTodosLoading}
              members={members}
              milestoneActionError={milestoneActionError}
              milestoneSearchQuery={milestoneSearchQuery}
              onCloseExpenseSheet={() => setExpenseSheetMilestoneId(null)}
              onCreateMilestone={() => {
                setEditingMilestone(null);
                setShowMilestoneForm(true);
              }}
              onAddTodo={(milestone) => {
                setSelectedMilestoneId(milestone.id);
                setEditingTodo(null);
                setShowTodoForm(true);
              }}
              onChangeTodoStatus={handleChangeTodoStatus}
              onDeleteMilestone={handleDeleteMilestone}
              onEditMilestone={(milestone) => {
                setEditingMilestone(milestone);
                setShowMilestoneForm(true);
              }}
              onMilestoneQueryChange={setMilestoneSearchQuery}
              onOpenExpenseSheet={(milestone) => {
                setSelectedMilestoneId(milestone.id);
                setExpenseSheetMilestoneId(milestone.id);
              }}
              onOpenMilestoneExpenseCreate={openCreateExpense}
              onOpenTimelineFromMilestone={() => openPlanTab('finance')}
              onReorderTodos={handleReorderTodosWithinMilestone}
              onSelectExpense={setDetailExpense}
              onSelectIncome={setDetailIncome}
              onSelectMilestone={setSelectedMilestoneId}
              onSortOrderChange={setTodoDueSortOrder}
              onStatusFilterChange={setTodoStatusFilter}
              onViewTodo={setDetailTodo}
              planId={planId}
              preserveSelectedMilestoneId={selectedMilestone?.id ?? null}
              searchStatusFilter={todoStatusFilter}
              selectedMilestone={selectedMilestone}
              selectedTodoSortOrder={todoDueSortOrder}
              sortedWorkMilestones={sortedWorkMilestones}
              todoActionError={todoActionError}
              todos={todos}
              visibleMilestones={visibleMilestones}
              workViewMode={workViewMode}
              onWorkViewModeChange={setWorkViewMode}
            />
            <ResponsiveModal
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto"
              description="Bản đầu của milestone core hỗ trợ tạo, sửa và sắp xếp lại các mốc lớn của kế hoạch."
              onOpenChange={(next) => {
                if (!next) {
                  setShowMilestoneForm(false);
                  setEditingMilestone(null);
                }
              }}
              open={showMilestoneForm}
              title={
                editingMilestone ? 'Cập nhật mốc kế hoạch' : 'Tạo mốc kế hoạch mới'
              }
            >
              <MilestoneForm
                currentMember={currentMember}
                currentUser={user}
                onClose={() => {
                  setShowMilestoneForm(false);
                  setEditingMilestone(null);
                }}
                onSuccess={() => {
                  setShowMilestoneForm(false);
                  setEditingMilestone(null);
                }}
                plan={ensuredPlan}
                {...(editingMilestone ? { milestone: editingMilestone } : {})}
              />
            </ResponsiveModal>
            <ResponsiveModal
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto"
              description="Todo luôn gắn với đúng một milestone để sau này nối sang thống kê tiến độ và dòng tiền."
              onOpenChange={(next) => {
                if (!next) {
                  setShowTodoForm(false);
                  setEditingTodo(null);
                }
              }}
              open={showTodoForm && Boolean(selectedMilestone)}
              title={
                editingTodo
                  ? 'Cập nhật công việc'
                  : selectedMilestone
                    ? `Thêm công việc cho "${selectedMilestone.title}"`
                    : ''
              }
            >
              {selectedMilestone ? (
                <TodoForm
                  currentMember={currentMember}
                  currentUser={user}
                  members={members}
                  milestone={selectedMilestone}
                  onCancel={() => {
                    setShowTodoForm(false);
                    setEditingTodo(null);
                  }}
                  onSuccess={() => {
                    setShowTodoForm(false);
                    setEditingTodo(null);
                  }}
                  plan={ensuredPlan}
                  {...(editingTodo ? { todo: editingTodo } : {})}
                />
              ) : null}
            </ResponsiveModal>
          </>
        );
      case 'weddingGuests':
        return plan.planType === 'wedding' ? (
          <WeddingGuestPanel currentMember={currentMember} plan={currentPlan} />
        ) : null;
      case 'members':
        return (
          <MembersTab
            activeMemberCount={activeMembers.length}
            canManageMembers={canManageMembers}
            currentMember={currentMember}
            invitations={invitations}
            isSubmitting={isMemberActionSubmitting}
            linkedMemberIds={linkedMemberIds}
            memberActionError={memberActionError}
            memberActionMessage={memberActionMessage}
            members={members}
            onCreateClaimInvitation={handleCreateClaimInvitation}
            onDeleteMember={handleDeleteMember}
            onReactivateMember={handleReactivateMember}
            onRemoveMember={handleRemoveMember}
            onRevokeInvitation={handleRevokeInvitation}
            onUnlinkAccount={handleUnlinkAccount}
            onUpdateAvatar={handleUpdateMemberAvatar}
            onUpdateMember={handleUpdateMember}
            plan={currentPlan}
            planId={planId}
          />
        );
      case 'travelItinerary':
        return (
          <TravelItineraryTab
            activities={travelActivities}
            canCreateExpense={canCreateExpense}
            canManage={canManageTravelActivities}
            detailActivity={detailTravelActivity}
            errorMessage={travelActionError}
            expenses={expenses}
            isLoading={isTravelActivitiesLoading}
            onCloseDetail={() => setDetailTravelActivity(null)}
            onCreate={() => {
              setEditingTravelActivity(null);
              setShowTravelActivityForm(true);
            }}
            onDelete={(activity) => void handleDeleteTravelActivity(activity)}
            onEdit={(activity) => {
              setDetailTravelActivity(null);
              setEditingTravelActivity(activity);
              setShowTravelActivityForm(true);
            }}
            onOpenCreateExpense={(activity) =>
              openCreateExpense('', activity.id)
            }
            onSelect={setDetailTravelActivity}
          />
        );
      case 'debtTracking':
        return (
          <DebtTrackingPanel
            legacyProps={{
              aggregates: debtAggregates,
              detailSnapshot: detailDebt,
              errorMessage: debtTrackingError,
              isLoading: isDebtTrackingLoading,
              members,
              onSelect: setDetailDebt,
              summary: debtTrackingSummary,
            }}
            nativeProps={{
              planId,
              members,
              transactions: debtTransactions,
              counterpartyLedgers: nativeDebtCounterpartyLedgers,
              isLoading: isNativeDebtLoading,
              errorMessage: nativeDebtError,
            }}
            plan={ensuredPlan}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <main className="flex flex-col gap-5">
      {planError ||
      milestoneError ||
      todoError ||
      memberError ||
      invitationError ||
      expenseError ||
      incomeError ||
      travelActivityError ||
      debtTrackingError ||
      settlementWatchError ? (
        <AuthFormMessage
          message={
            planError ||
            milestoneError ||
            todoError ||
            memberError ||
            invitationError ||
            expenseError ||
            incomeError ||
            travelActivityError ||
            debtTrackingError ||
            settlementWatchError ||
            'Hiện chưa thể đồng bộ dữ liệu kế hoạch mới nhất.'
          }
          type="error"
        />
      ) : null}
      {activeTab === 'overview' ? (
        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h1 className="min-w-0 flex-1 truncate text-3xl font-semibold text-slate-950">
                {plan.name}
              </h1>
              <div className="relative shrink-0">
                <button
                  aria-label="Tùy chọn kế hoạch"
                  className="flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                  onClick={() => setShowHeaderMenu((value) => !value)}
                  type="button"
                >
                  <MoreVertical className="size-4" />
                </button>
                {showHeaderMenu ? (
                  <>
                    <div className="hidden md:block">
                      <button
                        aria-label="Đóng menu"
                        className="fixed inset-0 z-40"
                        onClick={() => setShowHeaderMenu(false)}
                        type="button"
                      />
                      <Card className="absolute top-12 right-0 z-50 w-64 gap-1 p-2 shadow-[0_16px_60px_rgba(15,23,42,0.16)]">
                        {headerMenuItems.map((item) => (
                          <button
                            className={cn(
                              'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition hover:bg-slate-100',
                              item.destructive
                                ? 'text-rose-600'
                                : 'text-slate-700',
                            )}
                            key={item.key}
                            onClick={item.onSelect}
                            type="button"
                          >
                            <item.icon className="size-4 shrink-0" />
                            {item.label}
                          </button>
                        ))}
                      </Card>
                    </div>
                    <div className="md:hidden">
                      <BottomSheet
                        onClose={() => setShowHeaderMenu(false)}
                        open={showHeaderMenu}
                        title="Tùy chọn kế hoạch"
                      >
                        <div className="grid gap-1">
                          {headerMenuItems.map((item) => (
                            <button
                              className={cn(
                                'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition hover:bg-slate-100',
                                item.destructive
                                  ? 'text-rose-600'
                                  : 'text-slate-700',
                              )}
                              key={item.key}
                              onClick={item.onSelect}
                              type="button"
                            >
                              <item.icon className="size-4 shrink-0" />
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </BottomSheet>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            <p className="text-sm text-slate-600">
              {planTypeOptions.find((option) => option.value === plan.planType)
                ?.label ?? plan.planType}{' '}
              · {planStatusLabel[plan.status]}
            </p>

            {plan.description ? (
              <p className="text-sm leading-6 text-slate-600">
                {plan.description}
              </p>
            ) : null}
          </div>

          <div className="flex items-end justify-between gap-4">
            <div className="flex gap-8">
              {isNativeDebtPlan ? (
                <>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400 sm:text-xs sm:tracking-[0.16em]">
                      Phải thu
                    </p>
                    <p className="mt-1 text-xl font-semibold text-[color:var(--color-income)] sm:text-2xl">
                      {formatCompactCurrency(
                        nativeDebtSummary?.totalReceivableOutstanding ?? 0,
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400 sm:text-xs sm:tracking-[0.16em]">
                      Phải trả
                    </p>
                    <p className="mt-1 text-xl font-semibold text-[color:var(--color-expense)] sm:text-2xl">
                      {formatCompactCurrency(
                        nativeDebtSummary?.totalPayableOutstanding ?? 0,
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400 sm:text-xs sm:tracking-[0.16em]">
                      {spentLabel}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-950 sm:text-2xl">
                      {formatCompactCurrency(plan.totalExpense)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400 sm:text-xs sm:tracking-[0.16em]">
                      {estimatedLabel}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-600 sm:text-2xl">
                      {formatCompactCurrency(effectiveEstimatedTotal)}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400 sm:text-xs sm:tracking-[0.16em]">
                Thành viên
              </p>
              <MemberAvatarStack members={members} />
            </div>
          </div>
        </div>
      ) : null}

      <Card className="gap-4">
        <div className="flex items-center gap-2">
          {planDetailTabs.map((tab) => {
            const Icon = tabIcons[tab.id];
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                className={cn(
                  'flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-full text-sm font-medium transition-[background-color,color,padding] duration-200',
                  isActive
                    ? 'flex-1 bg-slate-950 px-4 text-white'
                    : 'bg-slate-100 px-3 text-slate-600 sm:flex-1 sm:px-4',
                )}
                onClick={() => openPlanTab(tab.id)}
                type="button"
              >
                <Icon className="size-4 shrink-0" />
                <span
                  className={cn(
                    'overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200',
                    isActive
                      ? 'max-w-[8rem] opacity-100'
                      : 'max-w-0 opacity-0 sm:max-w-[8rem] sm:opacity-100',
                  )}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
        {activeTabContent}
        <ResponsiveModal
          className="max-h-[90vh] w-full max-w-lg overflow-y-auto"
          onOpenChange={(next) => {
            if (!next) {
              setDetailTodo(null);
            }
          }}
          open={Boolean(detailTodo)}
          title="Chi tiết công việc"
        >
          {detailTodo ? (
            <TodoDetailView
              assignee={
                members.find(
                  (member) => member.id === detailTodo.assigneeMemberId,
                ) ?? null
              }
              canManagePlan={
                (hasCapability('planning.editAllTodo') ||
                  (hasCapability('planning.editOwnTodo') && detailTodo.createdByUserId === user?.uid)) &&
                plan.status !== 'closed'
              }
              isSubmitting={isTodoSubmitting}
              milestoneOptions={sortedWorkMilestones.map((milestone) => ({
                value: milestone.id,
                label: milestone.title,
              }))}
              onAddVendor={(todo) => {
                setDetailTodo(null);
                setTodoToRestoreAfterVendor(todo);
                setEditingVendorId(null);
                setVendorFormTodo(todo);
              }}
              onChangeStatus={handleChangeTodoStatus}
              onClose={() => setDetailTodo(null)}
              onDeleteTodo={(todo) => {
                setDetailTodo(null);
                void handleDeleteTodo(todo);
              }}
              onEdit={(todo) => {
                setDetailTodo(null);
                setSelectedMilestoneId(todo.milestoneId);
                setEditingTodo(todo);
                setShowTodoForm(true);
              }}
              onEditVendor={(todo, vendorId) => {
                setDetailTodo(null);
                setTodoToRestoreAfterVendor(todo);
                setEditingVendorId(vendorId);
                setVendorFormTodo(todo);
              }}
              onDeleteVendor={handleDeleteVendor}
              onMoveToMilestone={handleMoveTodoToMilestone}
              onSelectVendor={handleSelectTodoVendor}
              todo={detailTodo}
            />
          ) : null}
        </ResponsiveModal>
        <ResponsiveModal
          className="max-h-[90vh] w-full max-w-lg overflow-y-auto"
          onOpenChange={(next) => {
            if (!next) {
              setDetailExpense(null);
            }
          }}
          open={Boolean(detailExpense)}
          title="Chi tiết khoản chi"
        >
          {detailExpense ? (
            <ExpenseDetailPanel
              categories={[...categories, ...incomeCategories]}
              errorMessage={expenseActionError}
              expense={detailExpense}
              isDeleting={isDeletingExpenseInline}
              members={members}
              milestones={visibleMilestones}
              onClose={() => setDetailExpense(null)}
              onDelete={() => void handleDeleteExpenseInline(detailExpense)}
              onEdit={() => openEditExpense(detailExpense)}
              planId={planId}
              travelActivities={travelActivities}
              {...getExpenseDetailPermissions(detailExpense)}
            />
          ) : null}
        </ResponsiveModal>
        <ResponsiveModal
          className="max-h-[90vh] w-full max-w-lg overflow-y-auto"
          onOpenChange={(next) => {
            if (!next) {
              setDetailIncome(null);
            }
          }}
          open={Boolean(detailIncome)}
          title="Chi tiết khoản thu"
        >
          {detailIncome ? (
            <IncomeDetailPanel
              categories={[...categories, ...incomeCategories]}
              errorMessage={incomeActionError}
              income={detailIncome}
              isDeleting={isDeletingIncomeInline}
              members={members}
              milestones={visibleMilestones}
              onClose={() => setDetailIncome(null)}
              onDelete={() => void handleDeleteIncomeInline(detailIncome)}
              onEdit={() => openEditIncome(detailIncome)}
              {...getIncomeDetailPermissions(detailIncome)}
            />
          ) : null}
        </ResponsiveModal>
        <ResponsiveModal
          className="max-h-[90vh] w-full max-w-xl overflow-y-auto"
          onOpenChange={(next) => {
            if (!next) {
              closeExpenseForm();
            }
          }}
          open={showExpenseForm}
          title={editingExpense ? 'Sửa khoản chi' : 'Thêm khoản chi'}
        >
          <ExpenseForm
            defaultActivityId={expenseFormActivityId ?? undefined}
            defaultMilestoneId={expenseFormMilestoneId ?? undefined}
            expense={editingExpense ?? undefined}
            mode={editingExpense ? 'edit' : 'create'}
            onCancel={closeExpenseForm}
            onSuccess={closeExpenseForm}
            planId={planId}
          />
        </ResponsiveModal>
        <ResponsiveModal
          className="max-h-[90vh] w-full max-w-xl overflow-y-auto"
          onOpenChange={(next) => {
            if (!next) {
              closeIncomeForm();
            }
          }}
          open={showIncomeForm}
          title={editingIncome ? 'Sửa khoản thu' : 'Thêm khoản thu'}
        >
          <IncomeForm
            defaultMilestoneId={incomeFormMilestoneId ?? undefined}
            income={editingIncome ?? undefined}
            mode={editingIncome ? 'edit' : 'create'}
            onCancel={closeIncomeForm}
            onSuccess={closeIncomeForm}
            planId={planId}
          />
        </ResponsiveModal>
        <ResponsiveModal
          className="max-h-[90vh] w-full max-w-lg overflow-y-auto"
          description={
            vendorFormTodo
              ? editingVendor
                ? `Cập nhật thông tin nhà cung cấp cho "${vendorFormTodo.title}".`
                : `Thêm nhà cung cấp tham khảo cho "${vendorFormTodo.title}".`
              : undefined
          }
          onOpenChange={(next) => {
            if (!next) {
              closeVendorForm();
            }
          }}
          open={Boolean(vendorFormTodo)}
          title={editingVendor ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
        >
          {vendorFormTodo ? (
            <TodoVendorForm
              currentMember={currentMember}
              currentUser={user}
              onClose={closeVendorForm}
              onSuccess={closeVendorForm}
              plan={ensuredPlan}
              todo={vendorFormTodo}
              {...(editingVendor ? { vendor: editingVendor } : {})}
            />
          ) : null}
        </ResponsiveModal>
        {user ? (
          <ResponsiveModal
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto"
            description="Mỗi activity đại diện cho một chặng hoặc một điểm dừng trong itinerary."
            onOpenChange={(next) => {
              if (!next) {
                setShowTravelActivityForm(false);
                setEditingTravelActivity(null);
              }
            }}
            open={showTravelActivityForm}
            title={
              editingTravelActivity
                ? 'Cập nhật activity'
                : 'Thêm activity vào itinerary'
            }
          >
            <TravelActivityForm
              activity={editingTravelActivity ?? undefined}
              currentMember={currentMember}
              currentUser={user}
              onCancel={() => {
                setShowTravelActivityForm(false);
                setEditingTravelActivity(null);
              }}
              onSuccess={() => {
                setShowTravelActivityForm(false);
                setEditingTravelActivity(null);
              }}
              plan={ensuredPlan}
            />
          </ResponsiveModal>
        ) : null}
        {isOwner ? (
          <ResponsiveModal
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto"
            description="Chỉ chủ kế hoạch có thể sửa tên và thời gian diễn ra kế hoạch."
            onOpenChange={(next) => {
              if (!next) {
                setHeaderModal(null);
              }
            }}
            open={headerModal === 'edit-plan'}
            title="Chỉnh sửa kế hoạch"
          >
            <EditPlanForm
              currentMember={currentMember}
              onClose={() => setHeaderModal(null)}
              plan={currentPlan}
            />
          </ResponsiveModal>
        ) : null}
        <ConfirmDialog
          confirmLabel="Đóng kế hoạch"
          confirmVariant="destructive"
          description="Sau khi đóng, kế hoạch sẽ khóa các thao tác tạo hoặc chỉnh sửa mới. Dữ liệu hiện có vẫn có thể xem lại."
          loading={isClosingPlan}
          loadingLabel="Đang đóng kế hoạch..."
          onConfirm={handleClosePlan}
          onOpenChange={setShowClosePlanConfirm}
          open={showClosePlanConfirm}
          title="Xác nhận đóng kế hoạch?"
        />
        <ConfirmDialog
          confirmLabel="Lưu trữ kế hoạch"
          confirmVariant="destructive"
          description={`Kế hoạch sẽ được ẩn khỏi danh sách chính và chuyển vào mục "Kế hoạch đã lưu trữ" trong trang Cá nhân. Sau ${PLAN_ARCHIVE_RETENTION_DAYS} ngày, kế hoạch sẽ bị xóa vĩnh viễn nếu không được khôi phục.`}
          errorMessage={archivingError ?? undefined}
          loading={isArchivingPlan}
          loadingLabel="Đang lưu trữ..."
          onConfirm={handleArchivePlan}
          onOpenChange={setShowArchivePlanConfirm}
          open={showArchivePlanConfirm}
          title="Xác nhận lưu trữ kế hoạch?"
        />
        <ConfirmDialog
          confirmLabel="Xóa vĩnh viễn"
          confirmVariant="destructive"
          description="Toàn bộ dữ liệu của kế hoạch này — thành viên, mốc kế hoạch, công việc, khoản thu/chi, đối soát, lời mời — sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác."
          errorMessage={deletingError ?? undefined}
          loading={isDeletingPlan}
          loadingLabel="Đang xóa kế hoạch..."
          onConfirm={handleDeletePlan}
          onOpenChange={setShowDeletePlanConfirm}
          open={showDeletePlanConfirm}
          title="Xóa kế hoạch này?"
        />
        <ConfirmDialog
          confirmLabel="Xác nhận hoàn thành"
          confirmVariant="success"
          description="Khi đánh dấu hoàn thành, kế hoạch sẽ chuyển sang chế độ tổng kết và khóa các thao tác tạo hoặc chỉnh sửa mới."
          errorMessage={completionError ?? undefined}
          loading={isCompletingPlan}
          loadingLabel="Đang hoàn thành..."
          onConfirm={handleCompletePlan}
          onOpenChange={setShowCompletePlanConfirm}
          open={showCompletePlanConfirm}
          title="Hoàn thành kế hoạch này?"
        />
        {headerModal === 'plan-settings' ? (
          <ResponsiveModal
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto"
            description="Chủ kế hoạch có thể đóng kế hoạch để khóa thao tác mới nhưng vẫn giữ khả năng xem timeline và thống kê."
            onOpenChange={(next) => {
              if (!next) {
                setHeaderModal(null);
              }
            }}
            open={headerModal === 'plan-settings'}
            title="Cài đặt kế hoạch"
          >
            {closingError ? (
              <AuthFormMessage message={closingError} type="error" />
            ) : null}
            {completionError ? (
              <AuthFormMessage message={completionError} type="error" />
            ) : null}
            {archivingError ? (
              <AuthFormMessage message={archivingError} type="error" />
            ) : null}
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
              Múi giờ hiện tại: {plan.timezone}
              <br />
              Thành viên chủ kế hoạch: {plan.ownerMemberId}
              <br />
              Trạng thái kế hoạch: {plan.status}
              <br />
              Thời điểm đóng:{' '}
              {plan.closedAt
                ? formatDate(timestampToDate(plan.closedAt) ?? new Date())
                : 'Chưa đóng'}
            </div>

            <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Lock className="size-4 shrink-0" />
                  Khóa kế hoạch cho tôi
                </div>
                <Switch
                  aria-label="Khóa kế hoạch cho tôi"
                  checked={Boolean(mySummary?.isLocked)}
                  disabled={isSecurityActionSubmitting}
                  onCheckedChange={handleToggleSecurity}
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Chỉ khóa kế hoạch này trên tài khoản của bạn. Khi mở lại, bạn
                sẽ nhập mã bảo mật cá nhân của mình. Không ảnh hưởng tới thành
                viên khác.
              </p>
              {securityActionError ? (
                <div className="mt-3">
                  <AuthFormMessage
                    message={securityActionError}
                    type="error"
                  />
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              {isOwner ? (
                <Button
                  className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  disabled={isCompletingPlan || Boolean(isPlanEnded)}
                  onClick={() => setShowCompletePlanConfirm(true)}
                  variant="secondary"
                >
                  {plan.status === 'completed'
                    ? 'Đã hoàn thành kế hoạch'
                    : 'Hoàn thành kế hoạch'}
                </Button>
              ) : null}
              {isOwner ? (
                <Button
                  className="border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                  disabled={isClosingPlan || Boolean(isPlanEnded)}
                  onClick={() => setShowClosePlanConfirm(true)}
                  variant="secondary"
                >
                  {isPlanEnded ? 'Kế hoạch đã kết thúc' : 'Đóng kế hoạch'}
                </Button>
              ) : null}
              {isOwner ? (
                <Button
                  className="border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  disabled={isArchivingPlan || Boolean(isPlanEnded)}
                  onClick={() => setShowArchivePlanConfirm(true)}
                  variant="secondary"
                >
                  Lưu trữ kế hoạch
                </Button>
              ) : null}
              <Button onClick={() => setHeaderModal(null)} variant="ghost">
                Đóng
              </Button>
            </div>
          </ResponsiveModal>
        ) : null}
        {user ? (
          <ResponsiveModal
            className="w-full max-w-md"
            description="Mã này thuộc về tài khoản của bạn và chỉ dùng để khóa riêng các kế hoạch bạn tự bật."
            onOpenChange={(next) => {
              if (!next) {
                setHeaderModal('plan-settings');
              }
            }}
            open={headerModal === 'plan-lock'}
            title="Đặt mã bảo mật cá nhân"
          >
            <PasscodeForm
              onClose={() => setHeaderModal('plan-settings')}
              onSuccess={() => void handlePasscodeCreated()}
              userId={user.uid}
            />
          </ResponsiveModal>
        ) : null}
        <ConfirmDialog
          cancelLabel={isOwner ? 'Hủy' : 'Đã hiểu'}
          cancelVariant="ghost"
          confirmVariant="destructive"
          description={
            isOwner
              ? 'Xóa kế hoạch sẽ xóa vĩnh viễn toàn bộ dữ liệu — thành viên, mốc kế hoạch, công việc, khoản thu/chi, đối soát, lời mời. Hành động này không thể hoàn tác.'
              : 'Tính năng này đang được phát triển và sẽ sớm ra mắt.'
          }
          onOpenChange={(next) => {
            if (!next) {
              setHeaderModal(null);
            }
          }}
          open={headerModal === 'leave-or-delete'}
          title={isOwner ? 'Xóa kế hoạch' : 'Rời kế hoạch'}
          {...(isOwner
            ? {
                confirmLabel: 'Xóa kế hoạch',
                onConfirm: () => {
                  setHeaderModal(null);
                  setShowDeletePlanConfirm(true);
                },
              }
            : {})}
        />
        <ResponsiveModal
          className="max-h-[85vh] w-full max-w-4xl overflow-y-auto"
          onOpenChange={setShowStatisticSheet}
          open={showStatisticSheet}
          title="Tổng quan tài chính"
        >
          <div className="space-y-5">
            <FinanceSummaryHero statistic={statistic} />
            {effectiveEstimatedTotal > 0 ? (
              <FinanceBudgetProgress
                budgetAmount={effectiveEstimatedTotal}
                spent={statistic.overview.totalExpense}
              />
            ) : null}
            <div>
              <SectionHeading eyebrow="Chi tiêu" title="Chi tiêu được phân bổ như thế nào?" />
              <div className="mt-3 grid grid-cols-1 gap-4 xl:grid-cols-2">
                <FinanceCategoryDonut statistic={statistic} />
                <FinanceMilestoneBars statistic={statistic} />
              </div>
            </div>
            <MemberBalanceTable statistic={statistic} />
            <SettlementSuggestionList
              canConfirm={canManageSettlements && plan.status !== 'closed'}
              errorMessage={settlementError}
              isSubmitting={isSettlementSubmitting}
              members={members}
              message={settlementMessage}
              onConfirm={(suggestion) => handleConfirmSettlement(suggestion)}
              pendingAmount={statistic.overview.pendingSettlementAmount}
              settledAmount={statistic.overview.settledAmount}
              suggestions={suggestions}
            />
            <MemberSpendingList
              onSelectMember={(memberId) =>
                setStatisticMemberDrilldown({ memberId })
              }
              statistic={statistic}
            />
            {settlements.length > 0 ? (
              <div className="space-y-3">
                <SectionHeading
                  eyebrow="Lịch sử"
                  title="Lịch sử đối soát"
                  description="Các khoản đã xác nhận hoặc đã hủy."
                />
                <SettlementList
                  canCancel={canManageSettlements && plan.status !== 'closed'}
                  isSubmitting={isSettlementSubmitting}
                  members={members}
                  onCancel={handleCancelSettlement}
                  settlements={settlements}
                />
              </div>
            ) : null}
          </div>
        </ResponsiveModal>

        <BottomSheet
          onClose={() => setStatisticMemberDrilldown(null)}
          open={Boolean(statisticMemberDrilldownMember)}
          showCloseButton
          title={
            statisticMemberDrilldownMember
              ? `Khoản chi của ${statisticMemberDrilldownMember.nickname}`
              : 'Khoản chi của thành viên'
          }
        >
          {statisticMemberDrilldownMember ? (
            <TimelineList
              categories={[...categories, ...incomeCategories]}
              expenses={statisticMemberDrilldownExpenses}
              incomes={[]}
              members={members}
              milestones={visibleMilestones}
              onSelectExpense={setDetailExpense}
              onSelectIncome={setDetailIncome}
              planId={planId}
            />
          ) : null}
        </BottomSheet>

        <BottomSheet
          onClose={() => setStatisticMilestoneMemberDrilldown(null)}
          open={Boolean(
            statisticMilestoneMemberDrilldownMilestone &&
            statisticMilestoneMemberDrilldownMember,
          )}
          showCloseButton
          title={
            statisticMilestoneMemberDrilldownMilestone &&
            statisticMilestoneMemberDrilldownMember
              ? `${statisticMilestoneMemberDrilldownMember.nickname} · ${statisticMilestoneMemberDrilldownMilestone.title}`
              : 'Khoản chi'
          }
        >
          {statisticMilestoneMemberDrilldownMilestone &&
          statisticMilestoneMemberDrilldownMember ? (
            <TimelineList
              categories={[...categories, ...incomeCategories]}
              expenses={statisticMilestoneMemberDrilldownExpenses}
              hideMilestoneFilter
              incomes={[]}
              members={members}
              milestones={[statisticMilestoneMemberDrilldownMilestone]}
              onSelectExpense={setDetailExpense}
              onSelectIncome={setDetailIncome}
              planId={planId}
              selectedMilestoneId={
                statisticMilestoneMemberDrilldownMilestone.id
              }
            />
          ) : null}
        </BottomSheet>
      </Card>
    </main>
  );
}
