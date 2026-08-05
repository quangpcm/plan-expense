'use client';

import { useState } from 'react';
import { notFound, useParams } from 'next/navigation';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { InvitationList } from '@/modules/invitation/components/invitation-list';
import { usePlanInvitations } from '@/modules/invitation/hooks/use-plan-invitations';
import { useIncomes } from '@/modules/income/hooks/use-incomes';
import { useExpenseCategories } from '@/modules/category/hooks/use-expense-categories';
import { TimelineList } from '@/modules/expense/components/timeline-list';
import { useExpenses } from '@/modules/expense/hooks/use-expenses';
import { MemberList } from '@/modules/member/components/member-list';
import { MemberManagementPanel } from '@/modules/member/components/member-management-panel';
import { usePlanMembers } from '@/modules/member/hooks/use-plan-members';
import { memberService } from '@/modules/member/services';
import type { PlanMemberDocument, PlanRole } from '@/modules/member/types/member';
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
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

const tabs = ['Timeline', 'Statistic', 'Members', 'Setting'];

export default function PlanDetailPage() {
  const params = useParams<{ planId: string }>();
  const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId;
  const { user } = useAuthSession();
  const { plan, isLoading } = usePlan(planId);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Timeline');
  const { members, currentMember, permissions } = usePlanMembers(planId);
  const { invitations } = usePlanInvitations(planId);
  const { categories } = useExpenseCategories(planId);
  const { expenses } = useExpenses(planId);
  const { incomes } = useIncomes(planId);
  const { settlements } = useSettlements(planId);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);
  const [memberActionMessage, setMemberActionMessage] = useState<string | null>(null);
  const [isMemberActionSubmitting, setIsMemberActionSubmitting] = useState(false);
  const [settlementError, setSettlementError] = useState<string | null>(null);
  const [settlementMessage, setSettlementMessage] = useState<string | null>(null);
  const [isSettlementSubmitting, setIsSettlementSubmitting] = useState(false);
  const [closingError, setClosingError] = useState<string | null>(null);
  const [isClosingPlan, setIsClosingPlan] = useState(false);

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
  const updatedAt = timestampToDate(plan.updatedAt);
  const startDate = timestampToDate(plan.startDate);
  const endDate = timestampToDate(plan.endDate);
  const statistic = statisticService.calculate({
    members,
    expenses,
    incomes,
    categories,
    settlements,
  });
  const suggestions = settlementService.suggest(statistic.memberBalances);
  const activeMembers = members.filter((member) => member.status === 'active');

  async function handleUpdateRole(
    member: PlanMemberDocument,
    role: Exclude<PlanRole, 'owner'>,
    canEditAllExpenses: boolean,
  ) {
    if (!user) {
      return;
    }

    setIsMemberActionSubmitting(true);
    setMemberActionError(null);
    setMemberActionMessage(null);

    try {
      await memberService.updateMemberRole(
        planId,
        {
          memberId: member.id,
          role,
          canEditAllExpenses,
        },
        user,
        currentMember,
      );
      setMemberActionMessage('Member role updated.');
    } catch (error) {
      setMemberActionError(error instanceof Error ? error.message : 'Unable to update the member role.');
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
      setMemberActionMessage('Member removed from the active list.');
    } catch (error) {
      setMemberActionError(error instanceof Error ? error.message : 'Unable to remove the member.');
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
      setSettlementMessage('Settlement saved as completed.');
    } catch (error) {
      setSettlementError(error instanceof Error ? error.message : 'Unable to save this settlement.');
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
      setSettlementMessage('Settlement cancelled.');
    } catch (error) {
      setSettlementError(error instanceof Error ? error.message : 'Unable to cancel this settlement.');
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
      setClosingError(error instanceof Error ? error.message : 'Unable to close this plan right now.');
    } finally {
      setIsClosingPlan(false);
    }
  }

  return (
    <main className="flex flex-col gap-5">
      <Card className="gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <Badge variant="info">{plan.planType.replace('_', ' ')}</Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-slate-950">{plan.name}</h1>
              <p className="text-sm leading-6 text-slate-600">
                {plan.description || 'No description yet. Members, timeline, and statistics will build on this plan next.'}
              </p>
            </div>
          </div>
          <Badge variant={plan.status === 'active' ? 'success' : 'neutral'}>{plan.status}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-[24px] bg-slate-50 p-4 sm:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Members</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{plan.memberCount}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Expenses</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{plan.expenseCount}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Total expense</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(plan.totalExpense)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Updated</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {updatedAt ? formatDate(updatedAt) : 'Syncing...'}
            </p>
          </div>
        </div>
      </Card>

      <Card className="gap-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={
                activeTab === tab
                  ? 'min-h-11 rounded-full bg-slate-950 px-4 text-sm font-medium text-white'
                  : 'min-h-11 rounded-full bg-slate-100 px-4 text-sm font-medium text-slate-600'
              }
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>
        {activeTab === 'Timeline' ? (
          <>
            <SectionHeading
              eyebrow="Timeline"
              title="Live expense timeline"
              description="This is the primary working surface of the app. New expenses appear here in realtime and are grouped by day."
            />
            {plan.status === 'closed' ? (
              <AuthFormMessage
                message="This plan is closed. Timeline remains visible, but new expense changes are locked."
                type="success"
              />
            ) : null}
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
              Start date: {startDate ? formatDate(startDate) : 'Not set'}
              <br />
              End date: {endDate ? formatDate(endDate) : 'Not set'}
              <br />
              Timezone: {plan.timezone}
            </div>
            <TimelineList categories={categories} expenses={expenses} members={members} planId={planId} />
            <div className="flex justify-end">
              {plan.status === 'closed' ? (
                <Button disabled>Add Expense</Button>
              ) : (
                <Button href={`/plans/${planId}/expenses/new`}>Add Expense</Button>
              )}
            </div>
          </>
        ) : null}
        {activeTab === 'Statistic' ? (
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Statistic"
              title="Runtime plan statistics"
              description="These values are calculated directly from active members, expenses, incomes, and categories every time you open this section."
            />
            <StatisticOverview statistic={statistic} />
            <MemberBalanceTable statistic={statistic} />
            <Card>
              <SectionHeading
                eyebrow="Settlement Suggestion"
                title="Suggested transfers to settle balances"
                description="Suggestions use adjusted balance, so completed settlements are not proposed again."
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
                      No settlement suggestion is needed right now. Adjusted balances are already aligned.
                    </p>
                  </Card>
                )}
              </div>
            </Card>
            <CategoryBreakdown statistic={statistic} />
            <ExpenseTimelineChart statistic={statistic} />
            <div className="space-y-3">
              <SectionHeading
                eyebrow="Settlements"
                title="Completed and cancelled records"
                description="These are the real transfers that have been confirmed by the owner."
              />
              <SettlementList
                canCancel={permissions.canManageSettlements && plan.status !== 'closed'}
                isSubmitting={isSettlementSubmitting}
                members={members}
                onCancel={handleCancelSettlement}
                settlements={settlements}
              />
            </div>
            <Card>
              <SectionHeading
                eyebrow="Income"
                title="Record incoming fund contributions"
                description="Income is tracked separately from expense balance so the cashflow model stays explicit."
              />
              <div className="mt-4">
                {plan.status === 'closed' ? (
                  <Button disabled variant="secondary">
                    Add Income
                  </Button>
                ) : (
                  <Button href={`/plans/${planId}/incomes/new`} variant="secondary">
                    Add Income
                  </Button>
                )}
              </div>
            </Card>
          </div>
        ) : null}
        {activeTab === 'Members' ? (
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Members"
              title="Manage plan members"
              description="Owner permissions are now active for guest creation and invitation records."
            />
            {permissions.canManageMembers ? (
              <MemberManagementPanel currentMember={currentMember} planId={planId} />
            ) : (
              <Card>
                <p className="text-sm leading-6 text-slate-600">
                  You can view members, but only the owner can manage guest and invitation records.
                </p>
              </Card>
            )}
            <SectionHeading
              eyebrow="Member List"
              title={`Current members (${activeMembers.length})`}
              description="Removed members stay in Firestore history but should not be used for new transaction entry."
            />
            {memberActionError ? <AuthFormMessage message={memberActionError} type="error" /> : null}
            {memberActionMessage ? (
              <AuthFormMessage message={memberActionMessage} type="success" />
            ) : null}
            <MemberList
              canManageMembers={permissions.canManageMembers}
              isSaving={isMemberActionSubmitting}
              members={members}
              onRemove={handleRemoveMember}
              onUpdateRole={handleUpdateRole}
            />
            <SectionHeading
              eyebrow="Invitations"
              title="Pending invite records"
              description="Invitation acceptance flow will be expanded in a later phase, but the data records are now live."
            />
            <InvitationList invitations={invitations} />
          </div>
        ) : null}
        {activeTab === 'Setting' ? (
          <>
            <SectionHeading
              eyebrow="Setting"
              title="Plan status and safeguards"
              description="Owner can close the plan to lock new writes while keeping timeline and statistic readable."
            />
            {closingError ? <AuthFormMessage message={closingError} type="error" /> : null}
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
              Current timezone: {plan.timezone}
              <br />
              Owner member: {plan.ownerMemberId}
              <br />
              Plan status: {plan.status}
              <br />
              Closed at: {plan.closedAt ? formatDate(timestampToDate(plan.closedAt) ?? new Date()) : 'Not closed'}
            </div>
            {permissions.canManagePlan ? (
              <div className="flex justify-end">
                <Button disabled={isClosingPlan || plan.status === 'closed'} onClick={handleClosePlan} variant="ghost">
                  {plan.status === 'closed'
                    ? 'Plan Closed'
                    : isClosingPlan
                      ? 'Closing plan...'
                      : 'Close Plan'}
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </Card>
    </main>
  );
}
