'use client';

import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { ArchivedPlanListItem } from '@/modules/plan/components/archived-plan-list-item';
import { PLAN_ARCHIVE_RETENTION_DAYS } from '@/modules/plan/constants/plan.constants';
import { useArchivedPlans } from '@/modules/plan/hooks/use-archived-plans';
import { Breadcrumbs } from '@/shared/components/ui/breadcrumbs';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { Skeleton } from '@/shared/components/ui/skeleton';

export default function ArchivedPlansPage() {
  const { user } = useAuthSession();
  const { plans, isLoading, errorMessage } = useArchivedPlans();

  return (
    <main className="flex flex-col gap-5">
      <Breadcrumbs
        items={[
          { label: 'Cá nhân', href: '/profile' },
          { label: 'Kế hoạch đã lưu trữ' },
        ]}
      />
      <Card>
        <SectionHeading
          eyebrow="Lưu trữ"
          title="Kế hoạch đã lưu trữ"
          description={`Kế hoạch sẽ tự động bị xóa vĩnh viễn sau ${PLAN_ARCHIVE_RETENTION_DAYS} ngày kể từ ngày lưu trữ, trừ khi bạn khôi phục lại.`}
        />
      </Card>

      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}

      {isLoading ? (
        <div className="grid gap-4">
          <Skeleton className="h-28 rounded-[24px]" />
          <Skeleton className="h-28 rounded-[24px]" />
        </div>
      ) : plans.length > 0 ? (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <ArchivedPlanListItem key={plan.id} plan={plan} userId={user?.uid ?? ''} />
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-5 text-sm leading-7 text-[var(--color-muted)]">
          Không có kế hoạch nào đã lưu trữ.
        </div>
      )}
    </main>
  );
}
