'use client';

import { useParams } from 'next/navigation';

import { ExpenseForm } from '@/modules/expense/components/expense-form';
import { useExpense } from '@/modules/expense/hooks/use-expense';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { Skeleton } from '@/shared/components/ui/skeleton';

export default function EditExpensePage() {
  const params = useParams<{ planId: string; expenseId: string }>();
  const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId;
  const expenseId = Array.isArray(params.expenseId) ? params.expenseId[0] : params.expenseId;
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
      <Card>
        <SectionHeading
          eyebrow="Sửa khoản chi"
          title="Cập nhật chi tiết khoản chi"
          description="Chỉnh sửa số tiền, người trả, người tham gia và ghi chú mà vẫn giữ nguyên các tệp đính kèm hiện có."
        />
      </Card>
      <Card>
        <ExpenseForm expense={expense} mode="edit" planId={planId} />
      </Card>
    </main>
  );
}
