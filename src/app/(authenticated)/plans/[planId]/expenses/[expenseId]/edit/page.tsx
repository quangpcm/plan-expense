'use client';

import { useParams } from 'next/navigation';

import { ExpenseForm } from '@/modules/expense/components/expense-form';
import { useExpense } from '@/modules/expense/hooks/use-expense';
import { usePlan } from '@/modules/plan/hooks/use-plan';
import { Breadcrumbs } from '@/shared/components/ui/breadcrumbs';
import { Skeleton } from '@/shared/components/ui/skeleton';

export default function EditExpensePage() {
  const params = useParams<{ planId: string; expenseId: string }>();
  const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId;
  const expenseId = Array.isArray(params.expenseId) ? params.expenseId[0] : params.expenseId;
  const { plan } = usePlan(planId);
  const { expense, isLoading } = useExpense(planId, expenseId);

  if (isLoading) {
    return (
      <main className="flex flex-col gap-5">
        <Skeleton className="h-72 rounded-[32px]" />
      </main>
    );
  }

  if (!expense) {
    return null;
  }

  return (
    <main className="flex flex-col gap-5">
      <Breadcrumbs
        items={[
          { label: 'Kế hoạch', href: '/plans' },
          { label: plan?.name || 'Chi tiết kế hoạch', href: `/plans/${planId}` },
          { label: expense.title, href: `/plans/${planId}/expenses/${expenseId}` },
          { label: 'Chỉnh sửa' },
        ]}
      />
      <ExpenseForm expense={expense} mode="edit" planId={planId} />
    </main>
  );
}
