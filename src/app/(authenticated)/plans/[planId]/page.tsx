'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { notFound, useParams, useSearchParams } from 'next/navigation';
import { BarChart3, Clock, Flag, Plus, ReceiptText, Settings, Users } from 'lucide-react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { InvitationList } from '@/modules/invitation/components/invitation-list';
import { usePlanInvitations } from '@/modules/invitation/hooks/use-plan-invitations';
import { invitationService } from '@/modules/invitation/services';
import type { InvitationDocument } from '@/modules/invitation/types/invitation';
import { useIncomes } from '@/modules/income/hooks/use-incomes';
import { useExpenseCategories } from '@/modules/category/hooks/use-expense-categories';
import { useIncomeCategories } from '@/modules/category/hooks/use-income-categories';
import { TimelineList } from '@/modules/expense/components/timeline-list';
import { useExpenses } from '@/modules/expense/hooks/use-expenses';
import { MemberList } from '@/modules/member/components/member-list';
import { MemberManagementPanel } from '@/modules/member/components/member-management-panel';
import { usePlanMembers } from '@/modules/member/hooks/use-plan-members';
import { memberService } from '@/modules/member/services';
import type { PlanMemberDocument, PlanRole } from '@/modules/member/types/member';
import { buildLinkedMemberIdSet } from '@/modules/member/utils/member-linkage';
import { EditPlanForm } from '@/modules/plan/components/edit-plan-form';
import { planTypeGradients } from '@/modules/plan/constants/plan.constants';
import { planService } from '@/modules/plan/services';
import { usePlan } from '@/modules/plan/hooks/use-plan';
import {
  MilestoneExpensePanel,
  MilestoneForm,
  MilestoneTimelineBoard,
  milestoneService,
  useMilestones,
} from '@/modules/milestone';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import { TodoForm, TodoList, TodoVendorForm, useTodos, todoService } from '@/modules/todo';
import type { TodoDocument } from '@/modules/todo/types/todo';
import { CategoryBreakdown } from '@/modules/statistic/components/category-breakdown';
import { ExpenseTimelineChart } from '@/modules/statistic/components/expense-timeline-chart';
import { MemberBalanceTable } from '@/modules/statistic/components/member-balance-table';
import { MilestoneBreakdown } from '@/modules/statistic/components/milestone-breakdown';
import { StatisticOverview } from '@/modules/statistic/components/statistic-overview';
import { statisticService } from '@/modules/statistic/services';
import { SettlementList } from '@/modules/settlement/components/settlement-list';
import { SettlementSuggestionCard } from '@/modules/settlement/components/settlement-suggestion-card';
import { useSettlements } from '@/modules/settlement/hooks/use-settlements';
import { settlementService } from '@/modules/settlement/services';
import type { SettlementDocument, SettlementSuggestion } from '@/modules/settlement/types/settlement';
import { Badge } from '@/shared/components/ui/badge';
import { Breadcrumbs } from '@/shared/components/ui/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
import { BottomSheet } from '@/shared/components/ui/bottom-sheet';
import { Card } from '@/shared/components/ui/card';
import { Dialog } from '@/shared/components/ui/dialog';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import { cn } from '@/shared/utils/cn';

const tabs = ['Mốc kế hoạch', 'Thu chi', 'Todos', 'Thống kê', 'Thành viên', 'Thiết lập'] as const;

const tabIcons = {
  'Mốc kế hoạch': Flag,
  'Thu chi': Clock,
  Todos: Users,
  'Thống kê': BarChart3,
  'Thành viên': Users,
  'Thiết lập': Settings,
} as const;

const TAB_BY_QUERY_PARAM: Record<string, (typeof tabs)[number]> = {
  milestones: 'Mốc kế hoạch',
  timeline: 'Thu chi',
  todos: 'Todos',
  statistic: 'Thống kê',
  members: 'Thành viên',
  settings: 'Thiết lập',
};

export default function PlanDetailPage() {
  const params = useParams<{ planId: string }>();
  const searchParams = useSearchParams();
  const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId;
  const { user } = useAuthSession();
  const { plan, isLoading, errorMessage: planError } = usePlan(planId);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Mốc kế hoạch');
  const { milestones, isLoading: isMilestonesLoading, errorMessage: milestoneError } = useMilestones(planId);
  const { todos, isLoading: isTodosLoading, errorMessage: todoError } = useTodos(planId);
  const { members, currentMember, permissions, errorMessage: memberError } = usePlanMembers(planId);
  const { invitations, errorMessage: invitationError } = usePlanInvitations(planId);
  const { categories, errorMessage: categoryError } = useExpenseCategories(planId);
  const { categories: incomeCategories, errorMessage: incomeCategoryError } = useIncomeCategories(planId);
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
  const [isClosingPlan, setIsClosingPlan] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneDocument | null>(null);
  const [isMilestoneSubmitting, setIsMilestoneSubmitting] = useState(false);
  const [milestoneActionError, setMilestoneActionError] = useState<string | null>(null);
  const [editingTodo, setEditingTodo] = useState<TodoDocument | null>(null);
  const [showTodoForm, setShowTodoForm] = useState(false);
  const [isTodoSubmitting, setIsTodoSubmitting] = useState(false);
  const [todoActionError, setTodoActionError] = useState<string | null>(null);
  const [vendorFormTodo, setVendorFormTodo] = useState<TodoDocument | null>(null);
  const [expenseSheetMilestoneId, setExpenseSheetMilestoneId] = useState<string | null>(null);
  const previousPlanIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const isNewPlan = previousPlanIdRef.current !== undefined && previousPlanIdRef.current !== planId;
    previousPlanIdRef.current = planId;

    if (tabParam && TAB_BY_QUERY_PARAM[tabParam]) {
      setActiveTab(TAB_BY_QUERY_PARAM[tabParam]);
    } else if (isNewPlan) {
      setActiveTab('Mốc kế hoạch');
    }
  }, [planId, searchParams]);

  const currentPlan = plan;
  const statistic = statisticService.calculate({
    members,
    expenses,
    incomes,
    milestones,
    categories,
    settlements,
  });
  const suggestions = settlementService.suggest(statistic.memberBalances);
  const activeMembers = members.filter((member) => member.status === 'active');
  const linkedMemberIds = buildLinkedMemberIdSet({ expenses, incomes, settlements });
  const selectedMilestone = useMemo(
    () =>
      milestones.find((milestone) => milestone.id === selectedMilestoneId) ??
      milestones[0] ??
      null,
    [milestones, selectedMilestoneId],
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

  useEffect(() => {
    const milestoneIdParam = searchParams.get('milestoneId');

    if (milestoneIdParam && milestones.some((milestone) => milestone.id === milestoneIdParam)) {
      setSelectedMilestoneId(milestoneIdParam);
    }
  }, [milestones, searchParams]);

  useEffect(() => {
    if (!selectedMilestoneId && milestones[0]) {
      setSelectedMilestoneId(milestones[0].id);
      return;
    }

    if (selectedMilestoneId && !milestones.some((milestone) => milestone.id === selectedMilestoneId)) {
      setSelectedMilestoneId(milestones[0]?.id ?? null);
    }
  }, [milestones, selectedMilestoneId]);

  if (!planId) {
    notFound();
  }

  if (isLoading) {
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
    } catch (error) {
      setClosingError(error instanceof Error ? error.message : 'Hiện chưa thể đóng kế hoạch này.');
    } finally {
      setIsClosingPlan(false);
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

  return (
    <main className="flex flex-col gap-5">
      <Breadcrumbs
        items={[
          { label: 'Kế hoạch', href: '/plans' },
          { label: currentPlan.name },
        ]}
      />
      {planError ||
      milestoneError ||
      todoError ||
      memberError ||
      invitationError ||
      categoryError ||
      incomeCategoryError ||
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
            categoryError ||
            incomeCategoryError ||
            expenseError ||
            incomeError ||
            settlementWatchError ||
            'Hiện chưa thể đồng bộ dữ liệu kế hoạch mới nhất.'
          }
          type="error"
        />
      ) : null}
      <Card className={cn('gap-6')}>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h1 className="min-w-0 flex-1 truncate text-3xl font-semibold text-slate-950">{plan.name}</h1>
            <div className="flex shrink-0 gap-2">
              <Badge variant="info">{plan.planType.replace('_', ' ')}</Badge>
              <Badge variant={plan.status === 'active' ? 'success' : 'neutral'}>{plan.status}</Badge>
            </div>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            {plan.description || 'Chưa có mô tả. Thành viên, dòng thời gian và thống kê sẽ tiếp tục được xây dựng trên kế hoạch này.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-[24px] bg-white/60 p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Thành viên</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{plan.memberCount}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Tổng chi</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(plan.totalExpense)}</p>
          </div>
        </div>
      </Card>

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
        {activeTab === 'Thu chi' ? (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <SectionHeading
                eyebrow="Dòng tiền"
                title="Dòng tiền kế hoạch"
                description="Khoản chi và khoản thu của kế hoạch được nhóm theo ngày và có thể lọc theo từng mốc để bám sát tiến độ thực tế."
              />
              <div className="flex justify-end gap-2">
                {plan.status === 'closed' ? (
                  <Button disabled variant="secondary">
                    Thêm khoản thu
                  </Button>
                ) : (
                  <Button href={`/plans/${planId}/incomes/new`} variant="secondary">
                    Thêm khoản thu
                  </Button>
                )}
                {plan.status === 'closed' ? (
                  <Button disabled>Thêm khoản chi</Button>
                ) : (
                  <Button href={`/plans/${planId}/expenses/new${selectedMilestone?.id ? `?milestoneId=${selectedMilestone.id}` : ''}`}>Thêm khoản chi</Button>
                )}
              </div>
            </div>
            {plan.status === 'closed' ? (
              <AuthFormMessage
                message="Kế hoạch này đã đóng. Bạn vẫn xem được dữ liệu, nhưng không thể thêm hoặc sửa khoản chi mới."
                type="success"
              />
            ) : null}
            <TimelineList
              categories={[...categories, ...incomeCategories]}
              expenses={expenses}
              incomes={incomes}
              members={members}
              milestones={milestones}
              onSelectedMilestoneChange={setSelectedMilestoneId}
              planId={planId}
              selectedMilestoneId={selectedMilestone?.id ?? null}
            />
          </>
        ) : null}
        {activeTab === 'Mốc kế hoạch' ? (
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Milestones"
              title="Mốc kế hoạch"
              description="Mỗi mốc là một giai đoạn lớn của kế hoạch. Phase này tập trung dựng lõi milestone trước khi gắn todo và dòng tiền sâu hơn."
            />
            {milestoneActionError ? <AuthFormMessage message={milestoneActionError} type="error" /> : null}
            {todoActionError ? <AuthFormMessage message={todoActionError} type="error" /> : null}
            {isMilestonesLoading ? (
              <Skeleton className="h-48 rounded-[28px]" />
            ) : (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <MilestoneTimelineBoard
                  canManagePlan={permissions.canManagePlan}
                  isMilestoneSubmitting={isMilestoneSubmitting}
                  isPlanClosed={plan.status === 'closed'}
                  isTodoSubmitting={isTodoSubmitting}
                  milestones={milestones}
                  members={members}
                  onAddTodo={(milestone) => {
                    setSelectedMilestoneId(milestone.id);
                    setEditingTodo(null);
                    setShowTodoForm(true);
                  }}
                  onChangeTodoStatus={handleChangeTodoStatus}
                  onEditMilestone={(milestone) => {
                    setEditingMilestone(milestone);
                    setShowMilestoneForm(true);
                  }}
                  onEditTodo={(todo) => {
                    setSelectedMilestoneId(todo.milestoneId);
                    setEditingTodo(todo);
                    setShowTodoForm(true);
                  }}
                  onOpenExpenseSheet={(milestone) => {
                    setSelectedMilestoneId(milestone.id);
                    setExpenseSheetMilestoneId(milestone.id);
                  }}
                  onSelect={(milestoneId) => setSelectedMilestoneId(milestoneId)}
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
                        onShowTimeline={() => setActiveTab('Thu chi')}
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
              description="Danh sách khoản chi thuộc milestone đang chọn trên mobile."
              onClose={() => setExpenseSheetMilestoneId(null)}
              open={Boolean(expenseSheetMilestone)}
              title={expenseSheetMilestone ? `Khoản chi · ${expenseSheetMilestone.title}` : 'Khoản chi milestone'}
            >
              {expenseSheetMilestone ? (
                <MilestoneExpensePanel
                  canCreateExpense={plan.status !== 'closed'}
                  expenses={expenseSheetMilestoneExpenses}
                  milestone={expenseSheetMilestone}
                  planId={planId}
                />
              ) : null}
            </BottomSheet>
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
                      onSuccess={() => {
                        setShowMilestoneForm(false);
                        setEditingMilestone(null);
                      }}
                      plan={ensuredPlan}
                      {...(editingMilestone ? { milestone: editingMilestone } : {})}
                    />
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => {
                          setShowMilestoneForm(false);
                          setEditingMilestone(null);
                        }}
                        variant="ghost"
                      >
                        Đóng form
                      </Button>
                    </div>
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
                      onSuccess={() => {
                        setShowMilestoneForm(false);
                        setEditingMilestone(null);
                      }}
                      plan={ensuredPlan}
                      {...(editingMilestone ? { milestone: editingMilestone } : {})}
                    />
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => {
                          setShowMilestoneForm(false);
                          setEditingMilestone(null);
                        }}
                        variant="ghost"
                      >
                        Đóng form
                      </Button>
                    </div>
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
                      onSuccess={() => {
                        setShowTodoForm(false);
                        setEditingTodo(null);
                      }}
                      plan={ensuredPlan}
                      {...(editingTodo ? { todo: editingTodo } : {})}
                    />
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => {
                          setShowTodoForm(false);
                          setEditingTodo(null);
                        }}
                        variant="ghost"
                      >
                        Đóng form
                      </Button>
                    </div>
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
                      onSuccess={() => {
                        setShowTodoForm(false);
                        setEditingTodo(null);
                      }}
                      plan={ensuredPlan}
                      {...(editingTodo ? { todo: editingTodo } : {})}
                    />
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => {
                          setShowTodoForm(false);
                          setEditingTodo(null);
                        }}
                        variant="ghost"
                      >
                        Đóng form
                      </Button>
                    </div>
                  </BottomSheet>
                </div>
              </>
            ) : null}
            {permissions.canManagePlan && plan.status !== 'closed' ? (
              <button
                aria-label="Tạo mốc kế hoạch"
                className="fixed right-4 bottom-24 z-30 flex size-16 items-center justify-center rounded-full bg-[#0050cb] text-white shadow-[0_18px_45px_rgba(0,80,203,0.35)] transition hover:bg-[#0047b4] md:right-8 md:bottom-8"
                onClick={() => {
                  setEditingMilestone(null);
                  setShowMilestoneForm(true);
                }}
                type="button"
              >
                <Plus className="size-8" />
              </button>
            ) : null}
          </div>
        ) : null}
        {vendorFormTodo ? (
          <>
            <div className="fixed inset-0 z-40 hidden items-center justify-center bg-slate-950/40 px-4 md:flex">
              <button
                aria-label="Đóng form nhà cung cấp"
                className="absolute inset-0"
                onClick={() => setVendorFormTodo(null)}
                type="button"
              />
              <Dialog
                className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto"
                description={`Thêm nhà cung cấp tham khảo cho "${vendorFormTodo.title}".`}
                title="Thêm nhà cung cấp"
              >
                <TodoVendorForm
                  currentMember={currentMember}
                  currentUser={user}
                  onSuccess={() => setVendorFormTodo(null)}
                  plan={ensuredPlan}
                  todo={vendorFormTodo}
                />
                <div className="mt-4 flex justify-end">
                  <Button onClick={() => setVendorFormTodo(null)} variant="ghost">
                    Đóng form
                  </Button>
                </div>
              </Dialog>
            </div>
            <div className="md:hidden">
              <BottomSheet
                description={`Thêm nhà cung cấp tham khảo cho "${vendorFormTodo.title}".`}
                onClose={() => setVendorFormTodo(null)}
                open={Boolean(vendorFormTodo)}
                title="Thêm nhà cung cấp"
              >
                <TodoVendorForm
                  currentMember={currentMember}
                  currentUser={user}
                  onSuccess={() => setVendorFormTodo(null)}
                  plan={ensuredPlan}
                  todo={vendorFormTodo}
                />
                <div className="mt-4 flex justify-end">
                  <Button onClick={() => setVendorFormTodo(null)} variant="ghost">
                    Đóng form
                  </Button>
                </div>
              </BottomSheet>
            </div>
          </>
        ) : null}
        {activeTab === 'Thống kê' ? (
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Thống kê"
              title="Thống kê kế hoạch"
              description="Các số liệu được tính trực tiếp từ milestone, expense, income và settlement để ưu tiên góc nhìn theo từng giai đoạn của kế hoạch."
            />
            <StatisticOverview statistic={statistic} />
            <MilestoneBreakdown statistic={statistic} />
            <MemberBalanceTable statistic={statistic} />
            <CategoryBreakdown statistic={statistic} />
            <ExpenseTimelineChart statistic={statistic} />
            <Card>
              <SectionHeading
                eyebrow="Gợi ý đối soát"
                title="Gợi ý chuyển khoản để cân bằng"
                description="Các gợi ý dùng số dư thực, nên những khoản đã đối soát sẽ không bị đề xuất lại."
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
                      Hiện chưa cần gợi ý đối soát nào. Số dư thực của các thành viên đã cân bằng.
                    </p>
                  </Card>
                )}
              </div>
            </Card>
            <div className="space-y-3">
              <SectionHeading
                eyebrow="Đối soát"
                title="Lịch sử đã hoàn tất và đã hủy"
                description="Đây là các khoản chuyển tiền thực tế đã được chủ kế hoạch xác nhận."
              />
              <SettlementList
                canCancel={permissions.canManageSettlements && plan.status !== 'closed'}
                isSubmitting={isSettlementSubmitting}
                members={members}
                onCancel={handleCancelSettlement}
                settlements={settlements}
              />
            </div>
          </div>
        ) : null}
        {activeTab === 'Todos' ? (
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Todos"
              title="Tổng hợp công việc toàn kế hoạch"
              description="Danh sách này gom toàn bộ công việc từ các milestone, giúp bạn rà nhanh tiến độ mà không cần mở từng mốc."
            />
            {todoActionError ? <AuthFormMessage message={todoActionError} type="error" /> : null}
            {isTodosLoading ? (
              <Skeleton className="h-40 rounded-[28px]" />
            ) : (
              <TodoList
                canManagePlan={permissions.canManagePlan && plan.status !== 'closed'}
                emptyMessage="Kế hoạch này chưa có công việc nào."
                isSubmitting={isTodoSubmitting}
                members={members}
                onAddVendor={setVendorFormTodo}
                onChangeStatus={handleChangeTodoStatus}
                onDeleteTodo={handleDeleteTodo}
                onEdit={(todo) => {
                  setSelectedMilestoneId(todo.milestoneId);
                  setEditingTodo(todo);
                  setShowTodoForm(true);
                  setActiveTab('Mốc kế hoạch');
                }}
                todos={todos}
              />
            )}
          </div>
        ) : null}
        {activeTab === 'Thành viên' ? (
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Thành viên"
              title="Quản lý thành viên"
              description="Chủ kế hoạch hiện có thể thêm khách và quản lý các bản ghi lời mời."
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
            <SectionHeading
              eyebrow="Danh sách thành viên"
              title={`Thành viên hiện tại (${activeMembers.length})`}
              description="Thành viên đã xóa vẫn còn trong lịch sử Firestore nhưng không nên dùng cho giao dịch mới."
            />
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
              onUpdateMember={handleUpdateMember}
              planId={planId}
            />
            <SectionHeading
              eyebrow="Lời mời"
              title="Các lời mời đang chờ"
              description="Luồng chấp nhận lời mời sẽ được mở rộng ở phase sau, nhưng dữ liệu lời mời hiện đã hoạt động."
            />
            <InvitationList
              canRevoke={permissions.canManageMembers}
              invitations={invitations}
              isSubmitting={isMemberActionSubmitting}
              onRevoke={handleRevokeInvitation}
            />
          </div>
        ) : null}
        {activeTab === 'Thiết lập' ? (
          <>
            {permissions.canManagePlan ? (
              <>
                <SectionHeading
                  eyebrow="Thiết lập"
                  title="Thông tin kế hoạch"
                  description="Chỉ chủ kế hoạch có thể sửa tên và thời gian diễn ra kế hoạch."
                />
                <EditPlanForm currentMember={currentMember} plan={currentPlan} />
              </>
            ) : null}
            <SectionHeading
              eyebrow="Thiết lập"
              title="Trạng thái và khóa bảo vệ kế hoạch"
              description="Chủ kế hoạch có thể đóng kế hoạch để khóa thao tác mới nhưng vẫn giữ khả năng xem timeline và thống kê."
            />
            {closingError ? <AuthFormMessage message={closingError} type="error" /> : null}
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
              Múi giờ hiện tại: {plan.timezone}
              <br />
              Thành viên chủ kế hoạch: {plan.ownerMemberId}
              <br />
              Trạng thái kế hoạch: {plan.status}
              <br />
              Thời điểm đóng: {plan.closedAt ? formatDate(timestampToDate(plan.closedAt) ?? new Date()) : 'Chưa đóng'}
            </div>
            {permissions.canManagePlan ? (
              <div className="flex justify-end">
                <Button disabled={isClosingPlan || plan.status === 'closed'} onClick={handleClosePlan} variant="ghost">
                  {plan.status === 'closed'
                    ? 'Đã đóng kế hoạch'
                    : isClosingPlan
                      ? 'Đang đóng kế hoạch...'
                      : 'Đóng kế hoạch'}
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </Card>
    </main>
  );
}
