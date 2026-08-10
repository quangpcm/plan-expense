'use client';

import { useEffect, useRef, useState } from 'react';
import { notFound, useParams, useSearchParams } from 'next/navigation';
import { BarChart3, Clock, Settings, Users } from 'lucide-react';

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
import { CategoryBreakdown } from '@/modules/statistic/components/category-breakdown';
import { ExpenseTimelineChart } from '@/modules/statistic/components/expense-timeline-chart';
import { MemberBalanceTable } from '@/modules/statistic/components/member-balance-table';
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
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import { cn } from '@/shared/utils/cn';

const tabs = ['Dòng thời gian', 'Thống kê', 'Thành viên', 'Thiết lập'] as const;

const tabIcons = {
  'Dòng thời gian': Clock,
  'Thống kê': BarChart3,
  'Thành viên': Users,
  'Thiết lập': Settings,
} as const;

const TAB_BY_QUERY_PARAM: Record<string, (typeof tabs)[number]> = {
  timeline: 'Dòng thời gian',
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
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Dòng thời gian');
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
  const previousPlanIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const isNewPlan = previousPlanIdRef.current !== undefined && previousPlanIdRef.current !== planId;
    previousPlanIdRef.current = planId;

    if (tabParam && TAB_BY_QUERY_PARAM[tabParam]) {
      setActiveTab(TAB_BY_QUERY_PARAM[tabParam]);
    } else if (isNewPlan) {
      setActiveTab('Dòng thời gian');
    }
  }, [planId, searchParams]);

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

  if (!plan) {
    notFound();
  }

  const currentPlan = plan;
  const statistic = statisticService.calculate({
    members,
    expenses,
    incomes,
    categories,
    settlements,
  });
  const suggestions = settlementService.suggest(statistic.memberBalances);
  const activeMembers = members.filter((member) => member.status === 'active');
  const linkedMemberIds = buildLinkedMemberIdSet({ expenses, incomes, settlements });

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

    return invitationService.createClaimInvitation(currentPlan, member, email, user, currentMember);
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
        plan: currentPlan,
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
      await settlementService.cancel(currentPlan, settlement, user, currentMember);
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
      await planService.closePlan(currentPlan, currentMember);
    } catch (error) {
      setClosingError(error instanceof Error ? error.message : 'Hiện chưa thể đóng kế hoạch này.');
    } finally {
      setIsClosingPlan(false);
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
        {activeTab === 'Dòng thời gian' ? (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <SectionHeading
                eyebrow="Dòng thời gian"
                title="Dòng thời gian chi tiêu"
                description="Đây là khu vực làm việc chính của ứng dụng. Khoản chi mới sẽ xuất hiện realtime và được nhóm theo ngày."
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
                  <Button href={`/plans/${planId}/expenses/new`}>Thêm khoản chi</Button>
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
              planId={planId}
            />
          </>
        ) : null}
        {activeTab === 'Thống kê' ? (
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Thống kê"
              title="Thống kê kế hoạch"
              description="Các số liệu này được tính trực tiếp từ thành viên, khoản chi, khoản thu và danh mục mỗi khi bạn mở mục này."
            />
            <StatisticOverview statistic={statistic} />
            <MemberBalanceTable statistic={statistic} />
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
            <CategoryBreakdown statistic={statistic} />
            <ExpenseTimelineChart statistic={statistic} />
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
