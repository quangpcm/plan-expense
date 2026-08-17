'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { startTransition } from 'react';

import { ExpenseForm } from '@/modules/expense/components/expense-form';
import { usePlan } from '@/modules/plan/hooks/use-plan';
import { Breadcrumbs } from '@/shared/components/ui/breadcrumbs';

export default function CreateExpensePage() {
  const params = useParams<{ planId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId;
  const { plan } = usePlan(planId);
  const returnTab = searchParams.get('returnTab');

  function handleSuccess(milestoneId: string) {
    startTransition(() => {
      router.replace(
        returnTab === 'milestones'
          ? `/plans/${planId}?tab=milestones&milestoneId=${milestoneId}`
          : `/plans/${planId}?tab=timeline&milestoneId=${milestoneId}`,
      );
    });
  }

  return (
    <main className="flex flex-col gap-5">
      <Breadcrumbs
        items={[
          { label: plan?.name || 'Chi tiết kế hoạch', href: `/plans/${planId}` },
          { label: 'Tạo khoản chi' },
        ]}
      />
      <ExpenseForm mode="create" onCancel={() => router.back()} onSuccess={handleSuccess} planId={planId} />
    </main>
  );
}
