'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  BarChart3,
  Clock,
  Flag,
  LayoutDashboard,
  Lock,
  LogOut,
  MoreVertical,
  PencilLine,
  Plus,
  Settings,
  Trash2,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { InvitationList } from '@/modules/invitation/components/invitation-list';
import { usePlanInvitations } from '@/modules/invitation/hooks/use-plan-invitations';
import { invitationService } from '@/modules/invitation/services';
import type { InvitationDocument } from '@/modules/invitation/types/invitation';
import { useIncomes } from '@/modules/income/hooks/use-incomes';
import { getExpenseCategories, getIncomeCategories } from '@/modules/category/constants/category-presets';
import { TimelineList } from '@/modules/expense/components/timeline-list';
import { useExpenses } from '@/modules/expense/hooks/use-expenses';
import { MemberAvatarStack } from '@/modules/member/components/member-avatar-stack';
import { MemberList } from '@/modules/member/components/member-list';
import { MemberManagementPanel } from '@/modules/member/components/member-management-panel';
import { usePlanMembers } from '@/modules/member/hooks/use-plan-members';
import { memberService } from '@/modules/member/services';
import type { PlanMemberDocument, PlanRole } from '@/modules/member/types/member';
import { buildLinkedMemberIdSet } from '@/modules/member/utils/member-linkage';
import { EditPlanForm } from '@/modules/plan/components/edit-plan-form';
import { PlanUnlockGate } from '@/modules/plan/components/plan-unlock-gate';
import { planTypeOptions } from '@/modules/plan/constants/plan.constants';
import { planService } from '@/modules/plan/services';
import { usePlan } from '@/modules/plan/hooks/use-plan';
import { useUserPlans } from '@/modules/plan/hooks/use-user-plans';
import type { PlanStatus } from '@/modules/plan/types/plan';
import { PasscodeForm } from '@/modules/user/components/passcode-form';
import { useCurrentUserProfile } from '@/modules/user/hooks/use-current-user-profile';
import { Switch } from '@/shared/components/ui/switch';
import {
  MilestoneExpensePanel,
  MilestoneForm,
  MilestoneList,
  MilestoneSearchControl,
  MilestoneTimelineBoard,
  getMilestoneAnchorDate,
  milestoneService,
  useMilestones,
} from '@/modules/milestone';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import {
  TodoDetailView,
  TodoForm,
  TodoList,
  TodoListControls,
  TodoVendorForm,
  filterTodosByStatus,
  sortTodosByDueDate,
  useTodos,
  todoService,
} from '@/modules/todo';
import type { TodoDueSortOrder, TodoStatusFilter } from '@/modules/todo';
import type { TodoDocument } from '@/modules/todo/types/todo';
import { CategoryBreakdown } from '@/modules/statistic/components/category-breakdown';
import { CompletedPlanOverview } from '@/modules/statistic/components/completed-plan-overview';
import { ExpenseTimelineChart } from '@/modules/statistic/components/expense-timeline-chart';
import { MemberBalanceTable } from '@/modules/statistic/components/member-balance-table';
import { MemberSpendingList } from '@/modules/statistic/components/member-spending-list';
import { MilestoneBreakdown } from '@/modules/statistic/components/milestone-breakdown';
import { StatisticOverview } from '@/modules/statistic/components/statistic-overview';
import { statisticService } from '@/modules/statistic/services';
import { SettlementList } from '@/modules/settlement/components/settlement-list';
import { SettlementSuggestionCard } from '@/modules/settlement/components/settlement-suggestion-card';
import { useSettlements } from '@/modules/settlement/hooks/use-settlements';
import { settlementService } from '@/modules/settlement/services';
import type { SettlementDocument, SettlementSuggestion } from '@/modules/settlement/types/settlement';
import { getTodoBudgetAmount } from '@/modules/todo/utils/todo-budget';
import { Breadcrumbs } from '@/shared/components/ui/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
import { BottomSheet } from '@/shared/components/ui/bottom-sheet';
import { Card } from '@/shared/components/ui/card';
import { Dialog } from '@/shared/components/ui/dialog';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatCompactCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import { cn } from '@/shared/utils/cn';

const tabs = ['Tổng quan', 'Công việc', 'Tài chính', 'Thành viên'] as const;

const tabIcons = {
  'Tổng quan': LayoutDashboard,
  'Công việc': Flag,
  'Tài chính': Clock,
  'Thành viên': Users,
} as const;

const TAB_BY_QUERY_PARAM: Record<string, (typeof tabs)[number]> = {
  milestones: 'Công việc',
  todos: 'Công việc',
  timeline: 'Tài chính',
  statistic: 'Tài chính',
  members: 'Thành viên',
  // 'settings' xử lý riêng trong effect bên dưới — mở headerModal thay vì set activeTab
};

function getMilestoneWorkSortTime(milestone: MilestoneDocument) {
  return getMilestoneAnchorDate(milestone)?.getTime() ?? 0;
}

type HeaderModal = 'edit-plan' | 'plan-settings' | 'plan-lock' | 'leave-or-delete' | null;
type HeaderMenuItem = { key: string; label: string; icon: LucideIcon; destructive?: boolean; onSelect: () => void };

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
  const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId;
  const { user } = useAuthSession();
  const { plan, isLoading, errorMessage: planError } = usePlan(planId);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Tổng quan');
  const { milestones, isLoading: isMilestonesLoading, errorMessage: milestoneError } = useMilestones(planId);
  const { todos, isLoading: isTodosLoading, errorMessage: todoError } = useTodos(planId);
  const { members, currentMember, permissions, errorMessage: memberError } = usePlanMembers(planId);
  const { invitations, errorMessage: invitationError } = usePlanInvitations(planId);
  const estimatedTotal = useMemo(
    () => todos.reduce((total, todo) => total + (getTodoBudgetAmount(todo) ?? 0), 0),
    [todos],
  );
  const categories = useMemo(() => (plan ? getExpenseCategories(plan.planType) : []), [plan]);
  const incomeCategories = useMemo(() => (plan ? getIncomeCategories(plan.planType) : []), [plan]);
  const { expenses, errorMessage: expenseError } = useExpenses(planId);
  const { incomes, errorMessage: incomeError } = useIncomes(planId);
  const { settlements, errorMessage: settlementWatchError } = useSettlements(planId);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);
  const [memberActionMessage, setMemberActionMessage] = useState<string | null>(null);
  const [isMemberActionSubmitting, setIsMemberActionSubmitting] = useState(false);
  const [settlementError, setSettlementError] = useState<string | null>(null);
  const [settlementMessage, setSettlementMessage] = useState<string | null>(null);
  const [isSettlementSubmitting, setIsSettlementSubmitting] = useState(false);
  const [closingError, setClosingError] = useState<string | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [isClosingPlan, setIsClosingPlan] = useState(false);
  const [isCompletingPlan, setIsCompletingPlan] = useState(false);
  const [isPlanUnlocked, setIsPlanUnlocked] = useState(false);
  const [securityActionError, setSecurityActionError] = useState<string | null>(null);
  const [isSecurityActionSubmitting, setIsSecurityActionSubmitting] = useState(false);
  const { plans: myPlanSummaries, isLoading: isUserPlansLoading } = useUserPlans();
  const { userProfile, isLoading: isUserProfileLoading } = useCurrentUserProfile();
  const [deletingError, setDeletingError] = useState<string | null>(null);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);
  const [showDeletePlanConfirm, setShowDeletePlanConfirm] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [selectedTimelineMilestoneId, setSelectedTimelineMilestoneId] = useState<string | null>(null);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneDocument | null>(null);
  const [isMilestoneSubmitting, setIsMilestoneSubmitting] = useState(false);
  const [milestoneActionError, setMilestoneActionError] = useState<string | null>(null);
  const [editingTodo, setEditingTodo] = useState<TodoDocument | null>(null);
  const [showTodoForm, setShowTodoForm] = useState(false);
  const [isTodoSubmitting, setIsTodoSubmitting] = useState(false);
  const [todoActionError, setTodoActionError] = useState<string | null>(null);
  const [vendorFormTodo, setVendorFormTodo] = useState<TodoDocument | null>(null);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [detailTodo, setDetailTodo] = useState<TodoDocument | null>(null);
  const [todoToRestoreAfterVendor, setTodoToRestoreAfterVendor] = useState<TodoDocument | null>(null);
  const [expenseSheetMilestoneId, setExpenseSheetMilestoneId] = useState<string | null>(null);
  const [workViewMode, setWorkViewMode] = useState<'milestones' | 'todos'>('milestones');
  const [milestoneSearchQuery, setMilestoneSearchQuery] = useState('');
  const [todoStatusFilter, setTodoStatusFilter] = useState<TodoStatusFilter>('pending');
  const [todoDueSortOrder, setTodoDueSortOrder] = useState<TodoDueSortOrder>('oldest');
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [headerModal, setHeaderModal] = useState<HeaderModal>(null);
  const [showClosePlanConfirm, setShowClosePlanConfirm] = useState(false);
  const [showCompletePlanConfirm, setShowCompletePlanConfirm] = useState(false);
  const [showStatisticSheet, setShowStatisticSheet] = useState(false);
  const [statisticMemberDrilldown, setStatisticMemberDrilldown] = useState<{ memberId: string } | null>(null);
  const [statisticMilestoneMemberDrilldown, setStatisticMilestoneMemberDrilldown] = useState<{
    milestoneId: string;
    memberId: string;
  } | null>(null);
  const previousPlanIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const isNewPlan = previousPlanIdRef.current !== undefined && previousPlanIdRef.current !== planId;
    previousPlanIdRef.current = planId;

    if (tabParam === 'settings') {
      setHeaderModal('plan-settings');
    } else if (tabParam && TAB_BY_QUERY_PARAM[tabParam]) {
      setActiveTab(TAB_BY_QUERY_PARAM[tabParam]);

      if (tabParam === 'statistic') {
        setShowStatisticSheet(true);
      }
    } else if (isNewPlan) {
      setActiveTab('Tổng quan');
    }
  }, [planId, searchParams]);

  const currentPlan = plan;
  const isPlanEnded = plan?.status === 'completed' || plan?.status === 'closed';
  const statistic = useMemo(
    () =>
      statisticService.calculate({
        members,
        expenses,
        incomes,
        milestones,
        categories,
        settlements,
      }),
    [members, expenses, incomes, milestones, categories, settlements],
  );
  const suggestions = settlementService.suggest(statistic.memberBalances);
  const statisticMemberDrilldownMember = useMemo(
    () =>
      statisticMemberDrilldown
        ? (members.find((member) => member.id === statisticMemberDrilldown.memberId) ?? null)
        : null,
    [statisticMemberDrilldown, members],
  );
  const statisticMemberDrilldownExpenses = useMemo(
    () =>
      statisticMemberDrilldownMember
        ? expenses
            .filter((expense) => expense.paidByMemberId === statisticMemberDrilldownMember.id)
            .sort((a, b) => b.spentAt.toMillis() - a.spentAt.toMillis())
        : [],
    [statisticMemberDrilldownMember, expenses],
  );
  const statisticMilestoneMemberDrilldownMilestone = useMemo(
    () =>
      statisticMilestoneMemberDrilldown
        ? (milestones.find((milestone) => milestone.id === statisticMilestoneMemberDrilldown.milestoneId) ?? null)
        : null,
    [statisticMilestoneMemberDrilldown, milestones],
  );
  const statisticMilestoneMemberDrilldownMember = useMemo(
    () =>
      statisticMilestoneMemberDrilldown
        ? (members.find((member) => member.id === statisticMilestoneMemberDrilldown.memberId) ?? null)
        : null,
    [statisticMilestoneMemberDrilldown, members],
  );
  const statisticMilestoneMemberDrilldownExpenses = useMemo(
    () =>
      statisticMilestoneMemberDrilldownMilestone && statisticMilestoneMemberDrilldownMember
        ? expenses
            .filter(
              (expense) =>
                expense.milestoneId === statisticMilestoneMemberDrilldownMilestone.id &&
                expense.paidByMemberId === statisticMilestoneMemberDrilldownMember.id,
            )
            .sort((a, b) => b.spentAt.toMillis() - a.spentAt.toMillis())
        : [],
    [statisticMilestoneMemberDrilldownMilestone, statisticMilestoneMemberDrilldownMember, expenses],
  );
  const activeMembers = members.filter((member) => member.status === 'active');
  const linkedMemberIds = buildLinkedMemberIdSet({ expenses, incomes, settlements });
  const sortedWorkMilestones = useMemo(
    () =>
      [...milestones].sort((a, b) => {
        const timeDifference = getMilestoneWorkSortTime(a) - getMilestoneWorkSortTime(b);

        if (timeDifference !== 0) {
          return timeDifference;
        }

        return a.orderIndex - b.orderIndex;
      }),
    [milestones],
  );
  const defaultWorkMilestone = useMemo(() => {
    const eligible = sortedWorkMilestones.filter(
      (milestone) => milestone.status === 'in_progress' || milestone.status === 'upcoming',
    );

    return eligible[0] ?? sortedWorkMilestones[0] ?? null;
  }, [sortedWorkMilestones]);
  const selectedMilestone = useMemo(
    () =>
      sortedWorkMilestones.find((milestone) => milestone.id === selectedMilestoneId) ?? defaultWorkMilestone,
    [selectedMilestoneId, sortedWorkMilestones, defaultWorkMilestone],
  );
  const selectedMilestoneExpenses = useMemo(
    () =>
      selectedMilestone
        ? expenses
            .filter((expense) => expense.milestoneId === selectedMilestone.id)
            .sort((a, b) => b.spentAt.toMillis() - a.spentAt.toMillis())
        : [],
    [expenses, selectedMilestone],
  );
  const expenseSheetMilestone = useMemo(
    () => milestones.find((milestone) => milestone.id === expenseSheetMilestoneId) ?? null,
    [expenseSheetMilestoneId, milestones],
  );
  const expenseSheetMilestoneExpenses = useMemo(
    () =>
      expenseSheetMilestone
        ? expenses
            .filter((expense) => expense.milestoneId === expenseSheetMilestone.id)
            .sort((a, b) => b.spentAt.toMillis() - a.spentAt.toMillis())
        : [],
    [expenseSheetMilestone, expenses],
  );
  const upcomingMilestones = useMemo(() => {
    return milestones
      .filter((milestone) => milestone.status === 'in_progress' || milestone.status === 'upcoming')
      .sort((a, b) => getMilestoneWorkSortTime(a) - getMilestoneWorkSortTime(b))
      .slice(0, 2);
  }, [milestones]);
  const upcomingTodos = useMemo(() => {
    return todos
      .filter((todo) => todo.status !== 'done' && todo.status !== 'cancelled' && todo.dueDate)
      .sort((a, b) => a.dueDate!.toMillis() - b.dueDate!.toMillis())
      .slice(0, 5);
  }, [todos]);
  const endedPlanDate = useMemo(
    () =>
      timestampToDate(plan?.endDate ?? null) ??
      (plan?.status === 'closed' ? timestampToDate(plan.closedAt) : timestampToDate(plan?.updatedAt ?? null)),
    [plan],
  );
  const allTodosFilteredAndSorted = useMemo(
    () => sortTodosByDueDate(filterTodosByStatus(todos, todoStatusFilter), todoDueSortOrder),
    [todos, todoStatusFilter, todoDueSortOrder],
  );

  useEffect(() => {
    const milestoneIdParam = searchParams.get('milestoneId');

    if (milestoneIdParam && milestones.some((milestone) => milestone.id === milestoneIdParam)) {
      setSelectedTimelineMilestoneId(milestoneIdParam);
    }
  }, [milestones, searchParams]);

  useEffect(() => {
    const todoIdParam = searchParams.get('todoId');

    if (!todoIdParam) {
      return;
    }

    const matchedTodo = todos.find((todo) => todo.id === todoIdParam);

    if (!matchedTodo) {
      return;
    }

    setActiveTab('Công việc');
    setWorkViewMode('todos');
    setSelectedMilestoneId(matchedTodo.milestoneId);
    setDetailTodo((current) => (current?.id === matchedTodo.id ? current : matchedTodo));
  }, [searchParams, todos]);

  useEffect(() => {
    if (!selectedMilestoneId && defaultWorkMilestone) {
      setSelectedMilestoneId(defaultWorkMilestone.id);
      return;
    }

    if (
      selectedMilestoneId &&
      !sortedWorkMilestones.some((milestone) => milestone.id === selectedMilestoneId)
    ) {
      setSelectedMilestoneId(defaultWorkMilestone?.id ?? null);
    }
  }, [selectedMilestoneId, sortedWorkMilestones, defaultWorkMilestone]);

  useEffect(() => {
    if (selectedTimelineMilestoneId && !milestones.some((milestone) => milestone.id === selectedTimelineMilestoneId)) {
      setSelectedTimelineMilestoneId(null);
    }
  }, [milestones, selectedTimelineMilestoneId]);

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
    if (!todoToRestoreAfterVendor) {
      return;
    }

    const nextTodo = todos.find((todo) => todo.id === todoToRestoreAfterVendor.id) ?? null;

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
  const mySummary = myPlanSummaries.find((summary) => summary.planId === planId);
  const isPlanSecuredForMe = Boolean(mySummary?.isLocked && userProfile?.secretNumberHash);

  if (isPlanSecuredForMe && userProfile?.secretNumberHash && !isPlanUnlocked) {
    return <PlanUnlockGate onUnlock={() => setIsPlanUnlocked(true)} secretNumberHash={userProfile.secretNumberHash} />;
  }

  async function handleUpdateMember(
    member: PlanMemberDocument,
    values: { nickname: string; role: Exclude<PlanRole, 'owner'>; canEditAllExpenses: boolean },
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
          canEditAllExpenses: values.canEditAllExpenses,
        },
        user,
        currentMember,
      );
      setMemberActionMessage('Đã cập nhật thành viên.');
    } catch (error) {
      setMemberActionError(error instanceof Error ? error.message : 'Hiện chưa thể cập nhật thành viên.');
    } finally {
      setIsMemberActionSubmitting(false);
    }
  }

  async function handleUpdateMemberAvatar(member: PlanMemberDocument, avatarUrl: string | null) {
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
      setMemberActionError(error instanceof Error ? error.message : 'Hiện chưa thể cập nhật avatar thành viên.');
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
      setMemberActionError(error instanceof Error ? error.message : 'Hiện chưa thể ngừng hoạt động thành viên.');
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
      setMemberActionError(error instanceof Error ? error.message : 'Hiện chưa thể kích hoạt lại thành viên.');
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
      setMemberActionError(error instanceof Error ? error.message : 'Hiện chưa thể xóa thành viên.');
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
      setMemberActionError(error instanceof Error ? error.message : 'Hiện chưa thể gỡ liên kết tài khoản này.');
    } finally {
      setIsMemberActionSubmitting(false);
    }
  }

  async function handleCreateClaimInvitation(member: PlanMemberDocument, email: string | null) {
    if (!user) {
      throw new Error('Hiện chưa thể tạo link liên kết.');
    }

    return invitationService.createClaimInvitation(ensuredPlan, member, email, user, currentMember);
  }

  async function handleRevokeInvitation(invitation: InvitationDocument) {
    if (!user) {
      return;
    }

    setIsMemberActionSubmitting(true);
    setMemberActionError(null);
    setMemberActionMessage(null);

    try {
      await invitationService.revokeInvitation(planId, invitation.id, user, currentMember);
      setMemberActionMessage('Đã hủy lời mời.');
    } catch (error) {
      setMemberActionError(error instanceof Error ? error.message : 'Hiện chưa thể hủy lời mời này.');
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
      setSettlementError(error instanceof Error ? error.message : 'Hiện chưa thể lưu đối soát này.');
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
      await settlementService.cancel(ensuredPlan, settlement, user, currentMember);
      setSettlementMessage('Đã hủy đối soát.');
    } catch (error) {
      setSettlementError(error instanceof Error ? error.message : 'Hiện chưa thể hủy đối soát này.');
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
      setClosingError(error instanceof Error ? error.message : 'Hiện chưa thể đóng kế hoạch này.');
    } finally {
      setIsClosingPlan(false);
    }
  }

  async function handleCompletePlan() {
    setIsCompletingPlan(true);
    setCompletionError(null);

    try {
      await planService.completePlan(ensuredPlan, currentMember);
      setShowCompletePlanConfirm(false);
    } catch (error) {
      setCompletionError(error instanceof Error ? error.message : 'Hiện chưa thể hoàn thành kế hoạch này.');
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
      setSecurityActionError(error instanceof Error ? error.message : 'Hiện chưa thể cập nhật khóa cá nhân cho kế hoạch này.');
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
      setSecurityActionError(error instanceof Error ? error.message : 'Hiện chưa thể cập nhật khóa cá nhân cho kế hoạch này.');
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
      setDeletingError(error instanceof Error ? error.message : 'Hiện chưa thể xóa kế hoạch này.');
      setIsDeletingPlan(false);
    }
  }

  async function handleMoveMilestone(milestone: MilestoneDocument, direction: 'up' | 'down') {
    if (!currentPlan) {
      return;
    }

    const currentIndex = milestones.findIndex((item) => item.id === milestone.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetMilestone = milestones[targetIndex];

    if (currentIndex < 0 || !targetMilestone) {
      return;
    }

    setIsMilestoneSubmitting(true);
    setMilestoneActionError(null);

    try {
      const reordered = milestones.map((item, index) => {
        if (index === currentIndex) {
          return { milestoneId: item.id, orderIndex: targetMilestone.orderIndex };
        }

        if (index === targetIndex) {
          return { milestoneId: item.id, orderIndex: milestone.orderIndex };
        }

        return { milestoneId: item.id, orderIndex: item.orderIndex };
      });

      await milestoneService.reorderMilestones(ensuredPlan, reordered, currentMember);
    } catch (error) {
      setMilestoneActionError(error instanceof Error ? error.message : 'Hiện chưa thể sắp xếp lại mốc kế hoạch.');
    } finally {
      setIsMilestoneSubmitting(false);
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
      await milestoneService.deleteMilestone(ensuredPlan, milestone, user, currentMember);
    } catch (error) {
      setMilestoneActionError(error instanceof Error ? error.message : 'Hiện chưa thể xoá mốc kế hoạch này.');
    } finally {
      setIsMilestoneSubmitting(false);
    }
  }

  async function handleChangeTodoStatus(todo: TodoDocument, status: TodoDocument['status']) {
    if (!user) {
      return;
    }

    setIsTodoSubmitting(true);
    setTodoActionError(null);

    try {
      await todoService.updateTodo(
        ensuredPlan,
        {
          todoId: todo.id,
          milestoneId: todo.milestoneId,
          title: todo.title,
          description: todo.description || '',
          assigneeMemberId: todo.assigneeMemberId || '',
          dueDate: todo.dueDate ? new Date(todo.dueDate.toDate()).toISOString().slice(0, 10) : '',
          priority: todo.priority,
          status,
          budget: todo.budget ?? undefined,
          selectedTodoVendorId: todo.selectedTodoVendorId || undefined,
        },
        user,
        currentMember,
      );
    } catch (error) {
      setTodoActionError(error instanceof Error ? error.message : 'Hiện chưa thể cập nhật trạng thái công việc.');
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

  const editingVendor = vendorFormTodo?.vendors.find((vendor) => vendor.id === editingVendorId);

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
      setTodoActionError(error instanceof Error ? error.message : 'Hiện chưa thể chọn nhà cung cấp này.');
    } finally {
      setIsTodoSubmitting(false);
    }
  }

  async function handleDeleteVendor(todo: TodoDocument, vendorId: string) {
    if (!user) {
      return;
    }

    const vendor = todo.vendors.find((item) => item.id === vendorId);
    const confirmed = window.confirm(`Xoá nhà cung cấp "${vendor?.name ?? ''}"? Hành động này không thể hoàn tác.`);

    if (!confirmed) {
      return;
    }

    setIsTodoSubmitting(true);
    setTodoActionError(null);

    try {
      await todoService.deleteVendor(ensuredPlan, todo, vendorId, user, currentMember);
    } catch (error) {
      setTodoActionError(error instanceof Error ? error.message : 'Hiện chưa thể xoá nhà cung cấp này.');
    } finally {
      setIsTodoSubmitting(false);
    }
  }

  async function handleMoveTodoToMilestone(todo: TodoDocument, targetMilestoneId: string) {
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
      setTodoActionError(error instanceof Error ? error.message : 'Hiện chưa thể chuyển công việc sang milestone khác.');
    } finally {
      setIsTodoSubmitting(false);
    }
  }

  async function handleReorderTodosWithinMilestone(milestoneId: string, orderedTodoIds: string[]) {
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
      setTodoActionError(error instanceof Error ? error.message : 'Hiện chưa thể sắp xếp lại công việc.');
      throw error;
    } finally {
      setIsTodoSubmitting(false);
    }
  }

  async function handleDeleteTodo(todo: TodoDocument) {
    if (!user) {
      return;
    }

    const confirmed = window.confirm(`Xóa công việc "${todo.title}"? Hành động này không thể hoàn tác.`);

    if (!confirmed) {
      return;
    }

    setIsTodoSubmitting(true);
    setTodoActionError(null);

    try {
      await todoService.deleteTodo(ensuredPlan, todo, user, currentMember);
    } catch (error) {
      setTodoActionError(error instanceof Error ? error.message : 'Hiện chưa thể xóa công việc này.');
    } finally {
      setIsTodoSubmitting(false);
    }
  }

  const headerMenuItems: HeaderMenuItem[] = [
    permissions.canManagePlan
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
        setActiveTab('Thành viên');
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
      label: permissions.canManagePlan ? 'Xóa kế hoạch' : 'Rời kế hoạch',
      icon: permissions.canManagePlan ? Trash2 : LogOut,
      destructive: true,
      onSelect: () => {
        setShowHeaderMenu(false);
        setHeaderModal('leave-or-delete');
      },
    },
  ].filter((item): item is HeaderMenuItem => item !== null);

  return (
    <main className="flex flex-col gap-5">
      <Breadcrumbs
        items={[
          { label: currentPlan.name },
        ]}
      />
      {planError ||
      milestoneError ||
      todoError ||
      memberError ||
      invitationError ||
      expenseError ||
      incomeError ||
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
            settlementWatchError ||
            'Hiện chưa thể đồng bộ dữ liệu kế hoạch mới nhất.'
          }
          type="error"
        />
      ) : null}
      {activeTab === 'Tổng quan' ? (
        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h1 className="min-w-0 flex-1 truncate text-3xl font-semibold text-slate-950">{plan.name}</h1>
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
                              item.destructive ? 'text-rose-600' : 'text-slate-700',
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
                                item.destructive ? 'text-rose-600' : 'text-slate-700',
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
              {planTypeOptions.find((option) => option.value === plan.planType)?.label ?? plan.planType} ·{' '}
              {planStatusLabel[plan.status]}
            </p>

            {plan.description ? <p className="text-sm leading-6 text-slate-600">{plan.description}</p> : null}
          </div>

          <div className="flex items-end justify-between gap-4">
            <div className="flex gap-8">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Tổng chi</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{formatCompactCurrency(plan.totalExpense)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Dự kiến</p>
                <p className="mt-1 text-2xl font-semibold text-slate-600">{formatCompactCurrency(estimatedTotal)}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Thành viên</p>
              <MemberAvatarStack members={members} />
            </div>
          </div>
        </div>
      ) : null}

      <Card className="gap-4">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tabIcons[tab];
            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                className={cn(
                  'flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-full text-sm font-medium transition-[background-color,color,padding] duration-200',
                  isActive
                    ? 'flex-1 bg-slate-950 px-4 text-white'
                    : 'bg-slate-100 px-3 text-slate-600 sm:flex-1 sm:px-4',
                )}
                onClick={() => setActiveTab(tab)}
                type="button"
              >
                <Icon className="size-4 shrink-0" />
                <span
                  className={cn(
                    'overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200',
                    isActive ? 'max-w-[8rem] opacity-100' : 'max-w-0 opacity-0 sm:max-w-[8rem] sm:opacity-100',
                  )}
                >
                  {tab}
                </span>
              </button>
            );
          })}
        </div>
        {activeTab === 'Tổng quan' ? (
          <div className="space-y-6">
            {isPlanEnded ? (
              <>
                <CompletedPlanOverview
                  endedAtLabel={endedPlanDate ? formatDate(endedPlanDate) : 'Đã kết thúc'}
                  onSelectMember={(memberId) => setStatisticMemberDrilldown({ memberId })}
                  planStatus={plan.status}
                  statistic={statistic}
                />

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <CategoryBreakdown statistic={statistic} />
                  <MilestoneBreakdown
                    onSelectMilestoneMember={(milestoneId, memberId) =>
                      setStatisticMilestoneMemberDrilldown({ milestoneId, memberId })
                    }
                    statistic={statistic}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <SectionHeading eyebrow="Mốc kế hoạch" title="Mốc sắp tới" />
                  {milestoneActionError ? <AuthFormMessage message={milestoneActionError} type="error" /> : null}
                  {isMilestonesLoading ? (
                    <Skeleton className="h-32 rounded-[28px]" />
                  ) : (
                    <MilestoneList
                      canManagePlan={false}
                      emptyLabel="Không có mốc nào đang diễn ra hoặc sắp diễn ra."
                      isSubmitting={false}
                      milestones={upcomingMilestones}
                      onEdit={() => setActiveTab('Công việc')}
                      onMoveDown={() => {}}
                      onMoveUp={() => {}}
                      onSelect={(milestoneId) => {
                        setSelectedMilestoneId(milestoneId);
                        setActiveTab('Công việc');
                      }}
                      selectedMilestoneId={selectedMilestone?.id ?? null}
                    />
                  )}
                  <Button className="w-full justify-center" onClick={() => setActiveTab('Công việc')} variant="ghost">
                    Xem tất cả mốc
                  </Button>
                </div>

                <div className="space-y-3">
                  <SectionHeading
                    eyebrow="Công việc"
                    title="Việc sắp đến hạn"
                    description="5 việc chưa hoàn thành"
                  />
                  {todoActionError ? <AuthFormMessage message={todoActionError} type="error" /> : null}
                  {isTodosLoading ? (
                    <Skeleton className="h-32 rounded-[28px]" />
                  ) : (
                    <TodoList
                      canManagePlan={permissions.canManagePlan && !isPlanEnded}
                      emptyMessage="Không có công việc nào sắp đến hạn."
                      isSubmitting={isTodoSubmitting}
                      members={members}
                      milestones={milestones}
                      preserveOrder
                      onAddVendor={(todo) => {
                        setEditingVendorId(null);
                        setVendorFormTodo(todo);
                      }}
                      onChangeStatus={handleChangeTodoStatus}
                      onDeleteTodo={handleDeleteTodo}
                      onEdit={(todo) => {
                        setSelectedMilestoneId(todo.milestoneId);
                        setEditingTodo(todo);
                        setShowTodoForm(true);
                        setActiveTab('Công việc');
                      }}
                      todos={upcomingTodos}
                    />
                  )}
                  <Button className="w-full justify-center" onClick={() => setActiveTab('Công việc')} variant="ghost">
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
        ) : null}
        {activeTab === 'Tài chính' ? (
          <>
            <div className="flex flex-col gap-4">
              <SectionHeading eyebrow="Thu chi" title="Dòng tiền kế hoạch" />
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
                <div className="grid grid-cols-3 gap-2 lg:hidden">
                  <Button className="min-w-0 justify-center px-3" onClick={() => setShowStatisticSheet(true)} variant="secondary">
                    <BarChart3 className="size-4" />
                    Thống kê
                  </Button>
                  {isPlanEnded ? (
                    <Button className="min-w-0 px-3" disabled variant="secondary">
                      + Khoản Thu
                    </Button>
                  ) : (
                    <Button
                      className="min-w-0 justify-center border border-[var(--color-income)]/14 bg-[var(--color-income-soft)] px-3 text-[var(--color-income)] hover:bg-[color-mix(in_srgb,var(--color-income-soft)_72%,white)]"
                      href={`/plans/${planId}/incomes/new${selectedTimelineMilestoneId ? `?milestoneId=${selectedTimelineMilestoneId}&returnTab=timeline` : '?returnTab=timeline'}`}
                      variant="secondary"
                    >
                      + Khoản Thu
                    </Button>
                  )}
                  {isPlanEnded ? (
                    <Button className="min-w-0 px-3" disabled>
                      + Khoản Chi
                    </Button>
                  ) : (
                    <Button
                      className="min-w-0 justify-center bg-[color:color-mix(in_srgb,var(--color-primary)_92%,white)] px-3"
                      href={`/plans/${planId}/expenses/new${selectedTimelineMilestoneId ? `?milestoneId=${selectedTimelineMilestoneId}&returnTab=timeline` : '?returnTab=timeline'}`}
                    >
                      + Khoản Chi
                    </Button>
                  )}
                </div>

                <div className="hidden space-y-2 lg:block">
                  <Button className="w-full justify-center" onClick={() => setShowStatisticSheet(true)} variant="secondary">
                    <BarChart3 className="size-4" />
                    Thống kê
                  </Button>
                </div>
                <div className="hidden space-y-2 lg:block">
                  <div className="grid grid-cols-2 gap-2">
                    {isPlanEnded ? (
                      <Button className="min-w-0 px-3" disabled variant="secondary">
                        + Khoản Thu
                      </Button>
                    ) : (
                      <Button
                        className="min-w-0 justify-center border border-[var(--color-income)]/14 bg-[var(--color-income-soft)] text-[var(--color-income)] hover:bg-[color-mix(in_srgb,var(--color-income-soft)_72%,white)]"
                        href={`/plans/${planId}/incomes/new${selectedTimelineMilestoneId ? `?milestoneId=${selectedTimelineMilestoneId}&returnTab=timeline` : '?returnTab=timeline'}`}
                        variant="secondary"
                      >
                        + Khoản Thu
                      </Button>
                    )}
                    {isPlanEnded ? (
                      <Button className="min-w-0 px-3" disabled>
                        + Khoản Chi
                      </Button>
                    ) : (
                      <Button
                        className="min-w-0 justify-center bg-[color:color-mix(in_srgb,var(--color-primary)_92%,white)]"
                        href={`/plans/${planId}/expenses/new${selectedTimelineMilestoneId ? `?milestoneId=${selectedTimelineMilestoneId}&returnTab=timeline` : '?returnTab=timeline'}`}
                      >
                        + Khoản Chi
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {isPlanEnded ? (
              <AuthFormMessage
                message={
                  plan.status === 'completed'
                    ? 'Kế hoạch này đã hoàn thành. Bạn vẫn xem được dữ liệu và báo cáo tổng kết, nhưng không thể thêm hay sửa giao dịch mới.'
                    : 'Kế hoạch này đã dừng theo dõi. Bạn vẫn xem được dữ liệu và báo cáo tổng kết, nhưng không thể thêm hay sửa giao dịch mới.'
                }
                type="success"
              />
            ) : null}
            <TimelineList
              categories={[...categories, ...incomeCategories]}
              expenses={expenses}
              incomes={incomes}
              members={members}
              milestones={milestones}
              onSelectedMilestoneChange={setSelectedTimelineMilestoneId}
              planId={planId}
              selectedMilestoneId={selectedTimelineMilestoneId}
            />
          </>
        ) : null}
        {activeTab === 'Công việc' ? (
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Công việc"
              title={workViewMode === 'milestones' ? 'Lộ trình kế hoạch' : 'Tất cả công việc'}
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
                    workViewMode === 'milestones' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600',
                  )}
                  onClick={() => setWorkViewMode('milestones')}
                  type="button"
                >
                  Theo mốc
                </button>
                <button
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition',
                    workViewMode === 'todos' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600',
                  )}
                  onClick={() => setWorkViewMode('todos')}
                  type="button"
                >
                  Tất cả công việc
                </button>
              </div>
              {workViewMode === 'todos' ? (
                <TodoListControls
                  onSortOrderChange={setTodoDueSortOrder}
                  onStatusFilterChange={setTodoStatusFilter}
                  sortOrder={todoDueSortOrder}
                  statusFilter={todoStatusFilter}
                />
              ) : (
                <MilestoneSearchControl onQueryChange={setMilestoneSearchQuery} query={milestoneSearchQuery} />
              )}
            </div>
            {milestoneActionError ? <AuthFormMessage message={milestoneActionError} type="error" /> : null}
            {todoActionError ? <AuthFormMessage message={todoActionError} type="error" /> : null}
            {workViewMode === 'milestones' ? (
              <>
                {isMilestonesLoading ? (
                  <Skeleton className="h-48 rounded-[28px]" />
                ) : (
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                    <MilestoneTimelineBoard
                      canManagePlan={permissions.canManagePlan}
                      defaultExpandedMilestoneId={defaultWorkMilestone?.id ?? null}
                      isMilestoneSubmitting={isMilestoneSubmitting}
                      isPlanClosed={Boolean(isPlanEnded)}
                      isTodoSubmitting={isTodoSubmitting}
                      milestones={sortedWorkMilestones}
                      members={members}
                      onAddTodo={(milestone) => {
                        setSelectedMilestoneId(milestone.id);
                        setEditingTodo(null);
                        setShowTodoForm(true);
                      }}
                      onReorderTodos={handleReorderTodosWithinMilestone}
                      onChangeTodoStatus={handleChangeTodoStatus}
                      onEditMilestone={(milestone) => {
                        setEditingMilestone(milestone);
                        setShowMilestoneForm(true);
                      }}
                      onDeleteMilestone={handleDeleteMilestone}
                      onOpenExpenseSheet={(milestone) => {
                        setSelectedMilestoneId(milestone.id);
                        setExpenseSheetMilestoneId(milestone.id);
                      }}
                      onSelect={(milestoneId) => setSelectedMilestoneId(milestoneId)}
                      onViewTodo={setDetailTodo}
                      searchQuery={milestoneSearchQuery}
                      selectedMilestoneId={selectedMilestone?.id ?? null}
                      todos={todos}
                    />
                    {selectedMilestone ? (
                      <div className="space-y-4">
                        <div className="hidden lg:block">
                          <MilestoneExpensePanel
                            canCreateExpense={plan.status !== 'closed'}
                            expenses={selectedMilestoneExpenses}
                            milestone={selectedMilestone}
                            onShowTimeline={() => setActiveTab('Tài chính')}
                            planId={planId}
                          />
                        </div>
                      </div>
                    ) : (
                      <Card className="border-slate-200 bg-slate-50 shadow-none">
                        <p className="text-sm leading-6 text-slate-600">
                          Chọn một mốc kế hoạch để xem chi tiết hoặc tạo mốc đầu tiên nếu kế hoạch của bạn chưa có giai đoạn nào.
                        </p>
                      </Card>
                    )}
                  </div>
                )}
                <BottomSheet
                  description="Các khoản chi của milestone này được hiển thị theo dạng dòng thời gian."
                  onClose={() => setExpenseSheetMilestoneId(null)}
                  open={Boolean(expenseSheetMilestone)}
                  title={expenseSheetMilestone ? `Khoản chi · ${expenseSheetMilestone.title}` : 'Khoản chi milestone'}
                >
                  {expenseSheetMilestone ? (
                    <TimelineList
                      categories={[...categories, ...incomeCategories]}
                      expenses={expenseSheetMilestoneExpenses}
                      hideMilestoneFilter
                      incomes={[]}
                      members={members}
                      milestones={[expenseSheetMilestone]}
                      planId={planId}
                      selectedMilestoneId={expenseSheetMilestone.id}
                    />
                  ) : null}
                </BottomSheet>
                {permissions.canManagePlan && plan.status !== 'closed' ? (
                  <button
                    aria-label="Tạo mốc kế hoạch"
                    className="fixed right-4 bottom-24 z-30 flex size-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-[0_14px_34px_rgba(36,59,107,0.32)] transition hover:bg-[var(--color-primary-hover)] md:right-8 md:bottom-8"
                    onClick={() => {
                      setEditingMilestone(null);
                      setShowMilestoneForm(true);
                    }}
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
                    canManagePlan={permissions.canManagePlan && plan.status !== 'closed'}
                    emptyMessage={
                      todoStatusFilter === 'done'
                        ? 'Chưa có công việc nào hoàn thành.'
                        : 'Kế hoạch này chưa có công việc nào.'
                    }
                    isSubmitting={isTodoSubmitting}
                    members={members}
                    milestones={milestones}
                    onAddVendor={(todo) => {
                      setEditingVendorId(null);
                      setVendorFormTodo(todo);
                    }}
                    onChangeStatus={handleChangeTodoStatus}
                    onDeleteTodo={handleDeleteTodo}
                    onEdit={(todo) => {
                      setSelectedMilestoneId(todo.milestoneId);
                      setEditingTodo(todo);
                      setShowTodoForm(true);
                    }}
                    preserveOrder
                    todos={allTodosFilteredAndSorted}
                  />
                )}
              </div>
            )}
            {showMilestoneForm ? (
              <>
                <div className="fixed inset-0 z-40 hidden items-center justify-center bg-slate-950/40 px-4 md:flex">
                  <button
                    aria-label="Đóng form milestone"
                    className="absolute inset-0"
                    onClick={() => {
                      setShowMilestoneForm(false);
                      setEditingMilestone(null);
                    }}
                    type="button"
                  />
                  <Dialog
                    className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto"
                    description="Bản đầu của milestone core hỗ trợ tạo, sửa và sắp xếp lại các mốc lớn của kế hoạch."
                    title={editingMilestone ? 'Cập nhật mốc kế hoạch' : 'Tạo mốc kế hoạch mới'}
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
                  </Dialog>
                </div>
                <div className="md:hidden">
                  <BottomSheet
                    description="Bản đầu của milestone core hỗ trợ tạo, sửa và sắp xếp lại các mốc lớn của kế hoạch."
                    onClose={() => {
                      setShowMilestoneForm(false);
                      setEditingMilestone(null);
                    }}
                    open={showMilestoneForm}
                    title={editingMilestone ? 'Cập nhật mốc kế hoạch' : 'Tạo mốc kế hoạch mới'}
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
                  </BottomSheet>
                </div>
              </>
            ) : null}
            {showTodoForm && selectedMilestone ? (
              <>
                <div className="fixed inset-0 z-40 hidden items-center justify-center bg-slate-950/40 px-4 md:flex">
                  <button
                    aria-label="Đóng form todo"
                    className="absolute inset-0"
                    onClick={() => {
                      setShowTodoForm(false);
                      setEditingTodo(null);
                    }}
                    type="button"
                  />
                  <Dialog
                    className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto"
                    description="Todo luôn gắn với đúng một milestone để sau này nối sang thống kê tiến độ và dòng tiền."
                    title={editingTodo ? 'Cập nhật công việc' : `Thêm công việc cho "${selectedMilestone.title}"`}
                  >
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
                  </Dialog>
                </div>
                <div className="md:hidden">
                  <BottomSheet
                    description="Todo luôn gắn với đúng một milestone để sau này nối sang thống kê tiến độ và dòng tiền."
                    onClose={() => {
                      setShowTodoForm(false);
                      setEditingTodo(null);
                    }}
                    open={showTodoForm}
                    title={editingTodo ? 'Cập nhật công việc' : `Thêm công việc cho "${selectedMilestone.title}"`}
                  >
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
                  </BottomSheet>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
        {detailTodo ? (
          <>
            <div className="fixed inset-0 z-40 hidden items-center justify-center bg-slate-950/40 px-4 md:flex">
              <button
                aria-label="Đóng chi tiết công việc"
                className="absolute inset-0"
                onClick={() => setDetailTodo(null)}
                type="button"
              />
              <Dialog
                className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto"
                title="Chi tiết công việc"
              >
                <TodoDetailView
                  assignee={members.find((member) => member.id === detailTodo.assigneeMemberId) ?? null}
                  canManagePlan={permissions.canManagePlan && plan.status !== 'closed'}
                  isSubmitting={isTodoSubmitting}
                  milestoneOptions={sortedWorkMilestones.map((milestone) => ({ value: milestone.id, label: milestone.title }))}
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
              </Dialog>
            </div>
            <div className="md:hidden">
              <BottomSheet onClose={() => setDetailTodo(null)} open={Boolean(detailTodo)} title="Chi tiết công việc">
                <TodoDetailView
                  assignee={members.find((member) => member.id === detailTodo.assigneeMemberId) ?? null}
                  canManagePlan={permissions.canManagePlan && plan.status !== 'closed'}
                  isSubmitting={isTodoSubmitting}
                  milestoneOptions={sortedWorkMilestones.map((milestone) => ({ value: milestone.id, label: milestone.title }))}
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
              </BottomSheet>
            </div>
          </>
        ) : null}
        {vendorFormTodo ? (
          <>
            <div className="fixed inset-0 z-40 hidden items-center justify-center bg-slate-950/40 px-4 md:flex">
              <button
                aria-label="Đóng form nhà cung cấp"
                className="absolute inset-0"
                onClick={closeVendorForm}
                type="button"
              />
              <Dialog
                className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto"
                description={
                  editingVendor
                    ? `Cập nhật thông tin nhà cung cấp cho "${vendorFormTodo.title}".`
                    : `Thêm nhà cung cấp tham khảo cho "${vendorFormTodo.title}".`
                }
                title={editingVendor ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
              >
                <TodoVendorForm
                  currentMember={currentMember}
                  currentUser={user}
                  onClose={closeVendorForm}
                  onSuccess={closeVendorForm}
                  plan={ensuredPlan}
                  todo={vendorFormTodo}
                  {...(editingVendor ? { vendor: editingVendor } : {})}
                />
              </Dialog>
            </div>
            <div className="md:hidden">
              <BottomSheet
                description={
                  editingVendor
                    ? `Cập nhật thông tin nhà cung cấp cho "${vendorFormTodo.title}".`
                    : `Thêm nhà cung cấp tham khảo cho "${vendorFormTodo.title}".`
                }
                onClose={closeVendorForm}
                open={Boolean(vendorFormTodo)}
                title={editingVendor ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
              >
                <TodoVendorForm
                  currentMember={currentMember}
                  currentUser={user}
                  onClose={closeVendorForm}
                  onSuccess={closeVendorForm}
                  plan={ensuredPlan}
                  todo={vendorFormTodo}
                  {...(editingVendor ? { vendor: editingVendor } : {})}
                />
              </BottomSheet>
            </div>
          </>
        ) : null}
        {headerModal === 'edit-plan' && permissions.canManagePlan ? (
          <>
            <div className="fixed inset-0 z-40 hidden items-center justify-center bg-slate-950/40 px-4 md:flex">
              <button
                aria-label="Đóng form sửa kế hoạch"
                className="absolute inset-0"
                onClick={() => setHeaderModal(null)}
                type="button"
              />
              <Dialog
                className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto"
                description="Chỉ chủ kế hoạch có thể sửa tên và thời gian diễn ra kế hoạch."
                title="Chỉnh sửa kế hoạch"
              >
                <EditPlanForm currentMember={currentMember} onClose={() => setHeaderModal(null)} plan={currentPlan} />
              </Dialog>
            </div>
            <div className="md:hidden">
              <BottomSheet
                description="Chỉ chủ kế hoạch có thể sửa tên và thời gian diễn ra kế hoạch."
                onClose={() => setHeaderModal(null)}
                open={headerModal === 'edit-plan'}
                title="Chỉnh sửa kế hoạch"
              >
                <EditPlanForm currentMember={currentMember} onClose={() => setHeaderModal(null)} plan={currentPlan} />
              </BottomSheet>
            </div>
          </>
        ) : null}
        {showClosePlanConfirm ? (
          <>
            <div className="fixed inset-0 z-50 hidden items-center justify-center bg-slate-950/40 px-4 md:flex">
              <button
                aria-label="Đóng xác nhận đóng kế hoạch"
                className="absolute inset-0"
                onClick={() => setShowClosePlanConfirm(false)}
                type="button"
              />
              <Dialog
                className="relative z-10 w-full max-w-md"
                description="Sau khi đóng, kế hoạch sẽ khóa các thao tác tạo hoặc chỉnh sửa mới. Dữ liệu hiện có vẫn có thể xem lại."
                title="Xác nhận đóng kế hoạch?"
              >
                <div className="flex justify-end gap-2">
                  <Button onClick={() => setShowClosePlanConfirm(false)} variant="secondary">
                    Hủy
                  </Button>
                  <Button
                    className="bg-red-600 text-white hover:bg-red-700"
                    disabled={isClosingPlan}
                    onClick={handleClosePlan}
                  >
                    {isClosingPlan ? 'Đang đóng kế hoạch...' : 'Đóng kế hoạch'}
                  </Button>
                </div>
              </Dialog>
            </div>
            <div className="md:hidden">
              <BottomSheet
                description="Sau khi đóng, kế hoạch sẽ khóa các thao tác tạo hoặc chỉnh sửa mới. Dữ liệu hiện có vẫn có thể xem lại."
                onClose={() => setShowClosePlanConfirm(false)}
                open={showClosePlanConfirm}
                title="Xác nhận đóng kế hoạch?"
              >
                <div className="flex justify-end gap-2">
                  <Button onClick={() => setShowClosePlanConfirm(false)} variant="secondary">
                    Hủy
                  </Button>
                  <Button
                    className="bg-red-600 text-white hover:bg-red-700"
                    disabled={isClosingPlan}
                    onClick={handleClosePlan}
                  >
                    {isClosingPlan ? 'Đang đóng kế hoạch...' : 'Đóng kế hoạch'}
                  </Button>
                </div>
              </BottomSheet>
            </div>
          </>
        ) : null}
        {showDeletePlanConfirm ? (
          <>
            <div className="fixed inset-0 z-50 hidden items-center justify-center bg-slate-950/40 px-4 md:flex">
              <button
                aria-label="Đóng xác nhận xóa kế hoạch"
                className="absolute inset-0"
                onClick={() => (isDeletingPlan ? null : setShowDeletePlanConfirm(false))}
                type="button"
              />
              <Dialog
                className="relative z-10 w-full max-w-md"
                description="Toàn bộ dữ liệu của kế hoạch này — thành viên, mốc kế hoạch, công việc, khoản thu/chi, đối soát, lời mời — sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác."
                title="Xóa kế hoạch này?"
              >
                {deletingError ? <AuthFormMessage message={deletingError} type="error" /> : null}
                <div className="mt-4 flex justify-end gap-2">
                  <Button disabled={isDeletingPlan} onClick={() => setShowDeletePlanConfirm(false)} variant="secondary">
                    Hủy
                  </Button>
                  <Button
                    className="bg-red-600 text-white hover:bg-red-700"
                    disabled={isDeletingPlan}
                    onClick={handleDeletePlan}
                  >
                    {isDeletingPlan ? 'Đang xóa kế hoạch...' : 'Xóa vĩnh viễn'}
                  </Button>
                </div>
              </Dialog>
            </div>
            <div className="md:hidden">
              <BottomSheet
                description="Toàn bộ dữ liệu của kế hoạch này — thành viên, mốc kế hoạch, công việc, khoản thu/chi, đối soát, lời mời — sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác."
                onClose={() => (isDeletingPlan ? undefined : setShowDeletePlanConfirm(false))}
                open={showDeletePlanConfirm}
                title="Xóa kế hoạch này?"
              >
                {deletingError ? <AuthFormMessage message={deletingError} type="error" /> : null}
                <div className="mt-4 flex justify-end gap-2">
                  <Button disabled={isDeletingPlan} onClick={() => setShowDeletePlanConfirm(false)} variant="secondary">
                    Hủy
                  </Button>
                  <Button
                    className="bg-red-600 text-white hover:bg-red-700"
                    disabled={isDeletingPlan}
                    onClick={handleDeletePlan}
                  >
                    {isDeletingPlan ? 'Đang xóa kế hoạch...' : 'Xóa vĩnh viễn'}
                  </Button>
                </div>
              </BottomSheet>
            </div>
          </>
        ) : null}
        {showCompletePlanConfirm ? (
          <>
            <div className="fixed inset-0 z-50 hidden items-center justify-center bg-slate-950/40 px-4 md:flex">
              <button
                aria-label="Đóng xác nhận hoàn thành kế hoạch"
                className="absolute inset-0"
                onClick={() => setShowCompletePlanConfirm(false)}
                type="button"
              />
              <Dialog
                className="relative z-10 w-full max-w-md"
                description="Khi đánh dấu hoàn thành, kế hoạch sẽ chuyển sang chế độ tổng kết và khóa các thao tác tạo hoặc chỉnh sửa mới."
                title="Hoàn thành kế hoạch này?"
              >
                {completionError ? <AuthFormMessage message={completionError} type="error" /> : null}
                <div className="flex justify-end gap-2">
                  <Button onClick={() => setShowCompletePlanConfirm(false)} variant="secondary">
                    Hủy
                  </Button>
                  <Button
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    disabled={isCompletingPlan}
                    onClick={handleCompletePlan}
                  >
                    {isCompletingPlan ? 'Đang hoàn thành...' : 'Xác nhận hoàn thành'}
                  </Button>
                </div>
              </Dialog>
            </div>
            <div className="md:hidden">
              <BottomSheet
                description="Khi đánh dấu hoàn thành, kế hoạch sẽ chuyển sang chế độ tổng kết và khóa các thao tác tạo hoặc chỉnh sửa mới."
                onClose={() => setShowCompletePlanConfirm(false)}
                open={showCompletePlanConfirm}
                title="Hoàn thành kế hoạch này?"
              >
                {completionError ? <AuthFormMessage message={completionError} type="error" /> : null}
                <div className="flex justify-end gap-2">
                  <Button onClick={() => setShowCompletePlanConfirm(false)} variant="secondary">
                    Hủy
                  </Button>
                  <Button
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    disabled={isCompletingPlan}
                    onClick={handleCompletePlan}
                  >
                    {isCompletingPlan ? 'Đang hoàn thành...' : 'Xác nhận hoàn thành'}
                  </Button>
                </div>
              </BottomSheet>
            </div>
          </>
        ) : null}
        {headerModal === 'plan-settings' ? (
          <>
            <div className="fixed inset-0 z-40 hidden items-center justify-center bg-slate-950/40 px-4 md:flex">
              <button
                aria-label="Đóng cài đặt kế hoạch"
                className="absolute inset-0"
                onClick={() => setHeaderModal(null)}
                type="button"
              />
              <Dialog
                className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto"
                description="Chủ kế hoạch có thể đóng kế hoạch để khóa thao tác mới nhưng vẫn giữ khả năng xem timeline và thống kê."
                title="Cài đặt kế hoạch"
              >
                {closingError ? <AuthFormMessage message={closingError} type="error" /> : null}
                {completionError ? <AuthFormMessage message={completionError} type="error" /> : null}
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                  Múi giờ hiện tại: {plan.timezone}
                  <br />
                  Thành viên chủ kế hoạch: {plan.ownerMemberId}
                  <br />
                  Trạng thái kế hoạch: {plan.status}
                  <br />
                  Thời điểm đóng: {plan.closedAt ? formatDate(timestampToDate(plan.closedAt) ?? new Date()) : 'Chưa đóng'}
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
                    Chỉ khóa kế hoạch này trên tài khoản của bạn. Khi mở lại, bạn sẽ nhập mã bảo mật cá nhân của mình. Không ảnh hưởng tới thành viên khác.
                  </p>
                  {securityActionError ? (
                    <div className="mt-3">
                      <AuthFormMessage message={securityActionError} type="error" />
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  {permissions.canManagePlan ? (
                    <Button
                      className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      disabled={isCompletingPlan || Boolean(isPlanEnded)}
                      onClick={() => setShowCompletePlanConfirm(true)}
                      variant="secondary"
                    >
                      {plan.status === 'completed' ? 'Đã hoàn thành kế hoạch' : 'Hoàn thành kế hoạch'}
                    </Button>
                  ) : null}
                  {permissions.canManagePlan ? (
                    <Button
                      className="border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                      disabled={isClosingPlan || Boolean(isPlanEnded)}
                      onClick={() => setShowClosePlanConfirm(true)}
                      variant="secondary"
                    >
                      {isPlanEnded ? 'Kế hoạch đã kết thúc' : 'Đóng kế hoạch'}
                    </Button>
                  ) : null}
                  <Button onClick={() => setHeaderModal(null)} variant="ghost">
                    Đóng
                  </Button>
                </div>
              </Dialog>
            </div>
            <div className="md:hidden">
              <BottomSheet
                description="Chủ kế hoạch có thể đóng kế hoạch để khóa thao tác mới nhưng vẫn giữ khả năng xem timeline và thống kê."
                onClose={() => setHeaderModal(null)}
                open={headerModal === 'plan-settings'}
                title="Cài đặt kế hoạch"
              >
                {closingError ? <AuthFormMessage message={closingError} type="error" /> : null}
                {completionError ? <AuthFormMessage message={completionError} type="error" /> : null}
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                  Múi giờ hiện tại: {plan.timezone}
                  <br />
                  Thành viên chủ kế hoạch: {plan.ownerMemberId}
                  <br />
                  Trạng thái kế hoạch: {plan.status}
                  <br />
                  Thời điểm đóng: {plan.closedAt ? formatDate(timestampToDate(plan.closedAt) ?? new Date()) : 'Chưa đóng'}
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
                    Chỉ khóa kế hoạch này trên tài khoản của bạn. Khi mở lại, bạn sẽ nhập mã bảo mật cá nhân của mình. Không ảnh hưởng tới thành viên khác.
                  </p>
                  {securityActionError ? (
                    <div className="mt-3">
                      <AuthFormMessage message={securityActionError} type="error" />
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  {permissions.canManagePlan ? (
                    <Button
                      className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      disabled={isCompletingPlan || Boolean(isPlanEnded)}
                      onClick={() => setShowCompletePlanConfirm(true)}
                      variant="secondary"
                    >
                      {plan.status === 'completed' ? 'Đã hoàn thành kế hoạch' : 'Hoàn thành kế hoạch'}
                    </Button>
                  ) : null}
                  {permissions.canManagePlan ? (
                    <Button
                      className="border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                      disabled={isClosingPlan || Boolean(isPlanEnded)}
                      onClick={() => setShowClosePlanConfirm(true)}
                      variant="secondary"
                    >
                      {isPlanEnded ? 'Kế hoạch đã kết thúc' : 'Đóng kế hoạch'}
                    </Button>
                  ) : null}
                  <Button onClick={() => setHeaderModal(null)} variant="ghost">
                    Đóng
                  </Button>
                </div>
              </BottomSheet>
            </div>
          </>
        ) : null}
        {headerModal === 'plan-lock' && user ? (
          <>
            <div className="fixed inset-0 z-40 hidden items-center justify-center bg-slate-950/40 px-4 md:flex">
              <button
                aria-label="Đóng form đặt mã bảo mật cá nhân"
                className="absolute inset-0"
                onClick={() => setHeaderModal('plan-settings')}
                type="button"
              />
              <Dialog
                className="relative z-10 w-full max-w-md"
                description="Mã này thuộc về tài khoản của bạn và chỉ dùng để khóa riêng các kế hoạch bạn tự bật."
                title="Đặt mã bảo mật cá nhân"
              >
                <PasscodeForm
                  onClose={() => setHeaderModal('plan-settings')}
                  onSuccess={() => void handlePasscodeCreated()}
                  userId={user.uid}
                />
              </Dialog>
            </div>
            <div className="md:hidden">
              <BottomSheet
                description="Mã này thuộc về tài khoản của bạn và chỉ dùng để khóa riêng các kế hoạch bạn tự bật."
                onClose={() => setHeaderModal('plan-settings')}
                open={headerModal === 'plan-lock'}
                title="Đặt mã bảo mật cá nhân"
              >
                <PasscodeForm
                  onClose={() => setHeaderModal('plan-settings')}
                  onSuccess={() => void handlePasscodeCreated()}
                  userId={user.uid}
                />
              </BottomSheet>
            </div>
          </>
        ) : null}
        {headerModal === 'leave-or-delete' ? (
          <>
            <div className="fixed inset-0 z-40 hidden items-center justify-center bg-slate-950/40 px-4 md:flex">
              <button
                aria-label="Đóng"
                className="absolute inset-0"
                onClick={() => setHeaderModal(null)}
                type="button"
              />
              <Dialog
                className="relative z-10 w-full max-w-md"
                description={
                  permissions.canManagePlan
                    ? 'Xóa kế hoạch sẽ xóa vĩnh viễn toàn bộ dữ liệu — thành viên, mốc kế hoạch, công việc, khoản thu/chi, đối soát, lời mời. Hành động này không thể hoàn tác.'
                    : 'Tính năng này đang được phát triển và sẽ sớm ra mắt.'
                }
                title={permissions.canManagePlan ? 'Xóa kế hoạch' : 'Rời kế hoạch'}
              >
                <div className="flex justify-end gap-2">
                  <Button onClick={() => setHeaderModal(null)} variant="ghost">
                    {permissions.canManagePlan ? 'Hủy' : 'Đã hiểu'}
                  </Button>
                  {permissions.canManagePlan ? (
                    <Button
                      className="bg-red-600 text-white hover:bg-red-700"
                      onClick={() => {
                        setHeaderModal(null);
                        setShowDeletePlanConfirm(true);
                      }}
                    >
                      Xóa kế hoạch
                    </Button>
                  ) : null}
                </div>
              </Dialog>
            </div>
            <div className="md:hidden">
              <BottomSheet
                description={
                  permissions.canManagePlan
                    ? 'Xóa kế hoạch sẽ xóa vĩnh viễn toàn bộ dữ liệu — thành viên, mốc kế hoạch, công việc, khoản thu/chi, đối soát, lời mời. Hành động này không thể hoàn tác.'
                    : 'Tính năng này đang được phát triển và sẽ sớm ra mắt.'
                }
                onClose={() => setHeaderModal(null)}
                open={headerModal === 'leave-or-delete'}
                title={permissions.canManagePlan ? 'Xóa kế hoạch' : 'Rời kế hoạch'}
              >
                <div className="flex justify-end gap-2">
                  <Button onClick={() => setHeaderModal(null)} variant="ghost">
                    {permissions.canManagePlan ? 'Hủy' : 'Đã hiểu'}
                  </Button>
                  {permissions.canManagePlan ? (
                    <Button
                      className="bg-red-600 text-white hover:bg-red-700"
                      onClick={() => {
                        setHeaderModal(null);
                        setShowDeletePlanConfirm(true);
                      }}
                    >
                      Xóa kế hoạch
                    </Button>
                  ) : null}
                </div>
              </BottomSheet>
            </div>
          </>
        ) : null}
        <BottomSheet
          className="max-h-[85vh] overflow-y-auto"
          onClose={() => setShowStatisticSheet(false)}
          open={showStatisticSheet}
          title="Tổng quan tài chính"
        >
          <div className="space-y-5">
            <StatisticOverview statistic={statistic} />
            <MemberSpendingList
              onSelectMember={(memberId) => setStatisticMemberDrilldown({ memberId })}
              statistic={statistic}
            />
            <CategoryBreakdown statistic={statistic} />
            <MilestoneBreakdown
              onSelectMilestoneMember={(milestoneId, memberId) =>
                setStatisticMilestoneMemberDrilldown({ milestoneId, memberId })
              }
              statistic={statistic}
            />
            <MemberBalanceTable statistic={statistic} />
            <Card>
              <SectionHeading
                eyebrow="Đối soát"
                title="Ai cần chuyển cho ai?"
                description="Các khoản chuyển đề xuất để cân bằng chi phí giữa các thành viên."
              />
              {settlementError ? <AuthFormMessage message={settlementError} type="error" /> : null}
              {settlementMessage ? <AuthFormMessage message={settlementMessage} type="success" /> : null}
              <div className="grid gap-3">
                {suggestions.length > 0 ? (
                  suggestions.map((suggestion) => (
                    <SettlementSuggestionCard
                      canConfirm={permissions.canManageSettlements && plan.status !== 'closed'}
                      isSubmitting={isSettlementSubmitting}
                      key={`${suggestion.fromMemberId}-${suggestion.toMemberId}-${suggestion.amount}`}
                      members={members}
                      onConfirm={() => handleConfirmSettlement(suggestion)}
                      suggestion={suggestion}
                    />
                  ))
                ) : (
                  <Card className="border-slate-200 bg-slate-50 shadow-none">
                    <p className="text-sm leading-6 text-slate-600">
                      Chi phí giữa các thành viên đã cân bằng, chưa cần chuyển khoản nào.
                    </p>
                  </Card>
                )}
              </div>
            </Card>
            <div className="space-y-3">
              <SectionHeading
                eyebrow="Lịch sử"
                title="Lịch sử đối soát"
                description="Các khoản đã xác nhận hoặc đã hủy."
              />
              <SettlementList
                canCancel={permissions.canManageSettlements && plan.status !== 'closed'}
                isSubmitting={isSettlementSubmitting}
                members={members}
                onCancel={handleCancelSettlement}
                settlements={settlements}
              />
            </div>
            <ExpenseTimelineChart statistic={statistic} />
          </div>
        </BottomSheet>

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
              milestones={milestones}
              planId={planId}
            />
          ) : null}
        </BottomSheet>

        <BottomSheet
          onClose={() => setStatisticMilestoneMemberDrilldown(null)}
          open={Boolean(statisticMilestoneMemberDrilldownMilestone && statisticMilestoneMemberDrilldownMember)}
          showCloseButton
          title={
            statisticMilestoneMemberDrilldownMilestone && statisticMilestoneMemberDrilldownMember
              ? `${statisticMilestoneMemberDrilldownMember.nickname} · ${statisticMilestoneMemberDrilldownMilestone.title}`
              : 'Khoản chi'
          }
        >
          {statisticMilestoneMemberDrilldownMilestone && statisticMilestoneMemberDrilldownMember ? (
            <TimelineList
              categories={[...categories, ...incomeCategories]}
              expenses={statisticMilestoneMemberDrilldownExpenses}
              hideMilestoneFilter
              incomes={[]}
              members={members}
              milestones={[statisticMilestoneMemberDrilldownMilestone]}
              planId={planId}
              selectedMilestoneId={statisticMilestoneMemberDrilldownMilestone.id}
            />
          ) : null}
        </BottomSheet>
        {activeTab === 'Thành viên' ? (
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Thành viên"
              title="Thành viên kế hoạch"
              description="Thêm và quản lý những người tham gia kế hoạch."
            />
            {permissions.canManageMembers ? (
              <MemberManagementPanel currentMember={currentMember} plan={currentPlan} />
            ) : (
              <Card>
                <p className="text-sm leading-6 text-slate-600">
                  Bạn có thể xem danh sách thành viên, nhưng chỉ chủ kế hoạch mới được quản lý khách và lời mời.
                </p>
              </Card>
            )}
            <SectionHeading eyebrow="Danh sách" title={`Thành viên (${activeMembers.length})`} />
            {memberActionError ? <AuthFormMessage message={memberActionError} type="error" /> : null}
            {memberActionMessage ? (
              <AuthFormMessage message={memberActionMessage} type="success" />
            ) : null}
            <MemberList
              canManageMembers={permissions.canManageMembers}
              isSaving={isMemberActionSubmitting}
              linkedMemberIds={linkedMemberIds}
              members={members}
              onCreateClaimInvitation={handleCreateClaimInvitation}
              onDelete={handleDeleteMember}
              onReactivate={handleReactivateMember}
              onRemove={handleRemoveMember}
              onUnlinkAccount={handleUnlinkAccount}
              onUpdateAvatar={handleUpdateMemberAvatar}
              onUpdateMember={handleUpdateMember}
              planId={planId}
            />
            <SectionHeading eyebrow="Lời mời" title="Đang chờ tham gia" />
            <InvitationList
              canRevoke={permissions.canManageMembers}
              invitations={invitations}
              isSubmitting={isMemberActionSubmitting}
              onRevoke={handleRevokeInvitation}
            />
          </div>
        ) : null}
      </Card>
    </main>
  );
}
