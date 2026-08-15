'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { getExpenseCategories } from '@/modules/category/constants/category-presets';
import { ExpenseDetailCard } from '@/modules/expense/components/expense-detail-card';
import { useExpense } from '@/modules/expense/hooks/use-expense';
import { expenseService } from '@/modules/expense/services';
import { usePlanMembers } from '@/modules/member/hooks/use-plan-members';
import { useMilestones } from '@/modules/milestone';
import { usePlan } from '@/modules/plan/hooks/use-plan';
import { Breadcrumbs } from '@/shared/components/ui/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';

export default function ExpenseDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ planId: string; expenseId: string }>();
  const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId;
  const expenseId = Array.isArray(params.expenseId) ? params.expenseId[0] : params.expenseId;
  const { user } = useAuthSession();
  const { plan, errorMessage: planError } = usePlan(planId);
  const { milestones, errorMessage: milestoneError } = useMilestones(planId);
  const { members, currentMember, permissions } = usePlanMembers(planId);
  const { expense, isLoading, errorMessage: expenseError } = useExpense(planId, expenseId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (isLoading) {
    return (
      <main className="flex flex-col gap-5">
        <Skeleton className="h-72 rounded-[32px]" />
      </main>
    );
  }

  if (!expense || !plan || !user) {
    return null;
  }

  const currentUser = user;
  const currentExpense = expense;
  const currentPlan = plan;
  const categories = getExpenseCategories(currentPlan.planType);
  const returnTab = searchParams.get('returnTab');
  const milestoneId = searchParams.get('milestoneId') || currentExpense.milestoneId;
  const canEdit = permissions.canEditAllExpenses || currentExpense.createdByUserId === currentUser.uid;
  const canDelete = permissions.canDeleteAllExpenses || currentExpense.createdByUserId === currentUser.uid;

  async function handleDelete() {
    const confirmed = window.confirm(`Xoá khoản chi "${currentExpense.title}"? Hành động này không thể hoàn tác.`);

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await expenseService.deleteExpense(currentPlan, currentExpense, currentUser, currentMember);
      router.replace(
        returnTab === 'milestones'
          ? `/plans/${planId}?tab=milestones&milestoneId=${milestoneId}`
          : returnTab === 'timeline'
            ? `/plans/${planId}?tab=timeline${milestoneId ? `&milestoneId=${milestoneId}` : ''}`
            : `/plans/${planId}`,
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Hiện chưa thể xóa khoản chi này.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="flex flex-col gap-5">
      <Breadcrumbs
        items={[
          { label: currentPlan.name, href: `/plans/${planId}` },
          { label: currentExpense.title },
        ]}
      />
      {planError || expenseError || milestoneError ? (
        <AuthFormMessage
          message={planError || expenseError || milestoneError || 'Hiện chưa thể tải màn hình khoản chi này.'}
          type="error"
        />
      ) : null}
      <ExpenseDetailCard categories={categories} expense={expense} members={members} milestones={milestones} />
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
            href={`/plans/${planId}/expenses/${currentExpense.id}/edit${returnTab ? `?returnTab=${returnTab}${milestoneId ? `&milestoneId=${milestoneId}` : ''}` : ''}`}
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
