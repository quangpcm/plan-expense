'use client';

import { useParams } from 'next/navigation';

import { IncomeForm } from '@/modules/income/components/income-form';
import { useIncome } from '@/modules/income/hooks/use-income';
import { usePlan } from '@/modules/plan/hooks/use-plan';
import { Breadcrumbs } from '@/shared/components/ui/breadcrumbs';
import { Skeleton } from '@/shared/components/ui/skeleton';

export default function EditIncomePage() {
  const params = useParams<{ planId: string; incomeId: string }>();
  const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId;
  const incomeId = Array.isArray(params.incomeId) ? params.incomeId[0] : params.incomeId;
  const { plan } = usePlan(planId);
  const { income, isLoading } = useIncome(planId, incomeId);

  if (isLoading) {
    return (
      <main className="flex flex-col gap-5">
        <Skeleton className="h-72 rounded-[32px]" />
      </main>
    );
  }

  if (!income) {
    return null;
  }

  return (
    <main className="flex flex-col gap-5">
      <Breadcrumbs
        items={[
          { label: 'Kế hoạch', href: '/plans' },
          { label: plan?.name || 'Chi tiết kế hoạch', href: `/plans/${planId}` },
          { label: income.title, href: `/plans/${planId}/incomes/${incomeId}` },
          { label: 'Chỉnh sửa' },
        ]}
      />
      <IncomeForm income={income} mode="edit" planId={planId} />
    </main>
  );
}
