'use client';

import { useParams } from 'next/navigation';

import { ExpenseForm } from '@/modules/expense/components/expense-form';
import { usePlan } from '@/modules/plan/hooks/use-plan';
import { Breadcrumbs } from '@/shared/components/ui/breadcrumbs';

export default function CreateExpensePage() {
  const params = useParams<{ planId: string }>();
  const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId;
  const { plan } = usePlan(planId);

  return (
    <main className="flex flex-col gap-5">
      <Breadcrumbs
        items={[
          { label: plan?.name || 'Chi tiết kế hoạch', href: `/plans/${planId}` },
          { label: 'Tạo khoản chi' },
        ]}
      />
      <ExpenseForm mode="create" planId={planId} />
    </main>
  );
}
