'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { useExpenseCategories } from '@/modules/category/hooks/use-expense-categories';
import { useIncomeCategories } from '@/modules/category/hooks/use-income-categories';
import { IncomeDetailCard } from '@/modules/income/components/income-detail-card';
import { useIncome } from '@/modules/income/hooks/use-income';
import { incomeService } from '@/modules/income/services';
import { usePlanMembers } from '@/modules/member/hooks/use-plan-members';
import { useMilestones } from '@/modules/milestone';
import { usePlan } from '@/modules/plan/hooks/use-plan';
import { Breadcrumbs } from '@/shared/components/ui/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';

export default function IncomeDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ planId: string; incomeId: string }>();
  const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId;
  const incomeId = Array.isArray(params.incomeId) ? params.incomeId[0] : params.incomeId;
  const { user } = useAuthSession();
  const { plan, errorMessage: planError } = usePlan(planId);
  const { members, currentMember, permissions } = usePlanMembers(planId);
  const { categories: expenseCategories, errorMessage: expenseCategoryError } = useExpenseCategories(planId);
  const { categories: incomeCategories, errorMessage: incomeCategoryError } = useIncomeCategories(planId);
  const { milestones, errorMessage: milestoneError } = useMilestones(planId);
  const { income, isLoading, errorMessage: incomeError } = useIncome(planId, incomeId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (isLoading) {
    return (
      <main className="flex flex-col gap-5">
        <Skeleton className="h-72 rounded-[32px]" />
      </main>
    );
  }

  if (!income || !plan || !user) {
    return null;
  }

  const currentUser = user;
  const currentIncome = income;
  const currentPlan = plan;
  const returnTab = searchParams.get('returnTab');
  const milestoneId = searchParams.get('milestoneId') || currentIncome.milestoneId;
  const canEdit = permissions.canEditOwnIncome && currentIncome.createdByMemberId === currentMember?.id;
  const canDelete = permissions.canDeleteOwnIncome && currentIncome.createdByMemberId === currentMember?.id;

  async function handleDelete() {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await incomeService.deleteIncome(currentPlan, currentIncome, currentUser, currentMember);
      router.replace(
        returnTab === 'milestones'
          ? `/plans/${planId}?tab=milestones&milestoneId=${milestoneId}`
          : returnTab === 'timeline'
            ? `/plans/${planId}?tab=timeline${milestoneId ? `&milestoneId=${milestoneId}` : ''}`
            : `/plans/${planId}`,
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Hiện chưa thể xóa khoản thu này.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="flex flex-col gap-5">
      <Breadcrumbs
        items={[
          { label: 'Kế hoạch', href: '/plans' },
          { label: currentPlan.name, href: `/plans/${planId}` },
          { label: currentIncome.title },
        ]}
      />
      {planError || expenseCategoryError || incomeCategoryError || milestoneError || incomeError ? (
        <AuthFormMessage
          message={
            planError ||
            expenseCategoryError ||
            incomeCategoryError ||
            milestoneError ||
            incomeError ||
            'Hiện chưa thể tải màn hình khoản thu này.'
          }
          type="error"
        />
      ) : null}
      <IncomeDetailCard
        categories={[...expenseCategories, ...incomeCategories]}
        income={income}
        members={members}
        milestones={milestones}
      />
      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      <Card className="gap-3 sm:flex-row sm:justify-end">
        <Button
          href={
            returnTab === 'milestones'
              ? `/plans/${planId}?tab=milestones&milestoneId=${milestoneId}`
              : returnTab === 'timeline'
                ? `/plans/${planId}?tab=timeline${milestoneId ? `&milestoneId=${milestoneId}` : ''}`
                : `/plans/${planId}`
          }
          variant="secondary"
        >
          Quay lại kế hoạch
        </Button>
        {canEdit ? (
          <Button
            href={`/plans/${planId}/incomes/${currentIncome.id}/edit${returnTab ? `?returnTab=${returnTab}${milestoneId ? `&milestoneId=${milestoneId}` : ''}` : ''}`}
          >
            Chỉnh sửa
          </Button>
        ) : null}
        {canDelete ? (
          <Button disabled={isDeleting} onClick={handleDelete} variant="ghost">
            {isDeleting ? 'Đang xóa...' : 'Xóa'}
          </Button>
        ) : null}
      </Card>
    </main>
  );
}
