'use client';

import { useParams } from 'next/navigation';

import { ExpenseForm } from '@/modules/expense/components/expense-form';
import { usePlan } from '@/modules/plan/hooks/use-plan';
import { Breadcrumbs } from '@/shared/components/ui/breadcrumbs';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';

export default function CreateExpensePage() {
  const params = useParams<{ planId: string }>();
  const planId = Array.isArray(params.planId) ? params.planId[0] : params.planId;
  const { plan } = usePlan(planId);

  return (
    <main className="flex flex-col gap-5">
      <Breadcrumbs
        items={[
          { label: 'Kế hoạch', href: '/plans' },
          { label: plan?.name || 'Chi tiết kế hoạch', href: `/plans/${planId}` },
          { label: 'Tạo khoản chi' },
        ]}
      />
      <Card>
        <SectionHeading
          eyebrow="Tạo khoản chi"
          title="Thêm khoản chi mới chỉ trong vài giây"
          description="Thiết lập mặc định sẽ dùng tất cả thành viên đang hoạt động, chia đều và lấy thời gian hiện tại để nhập nhanh."
        />
      </Card>
      <Card>
        <ExpenseForm mode="create" planId={planId} />
      </Card>
    </main>
  );
}
