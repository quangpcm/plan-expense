'use client';

import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { ArchivedPlanListItem } from '@/modules/plan/components/archived-plan-list-item';
import { PLAN_ARCHIVE_RETENTION_DAYS } from '@/modules/plan/constants/plan.constants';
import { useArchivedPlans } from '@/modules/plan/hooks/use-archived-plans';
import { Breadcrumbs } from '@/shared/components/ui/breadcrumbs';
import { EmptyState } from '@/shared/components/ui/empty-state';
import { EntityList } from '@/shared/components/ui/entity-list';
import { Section } from '@/shared/components/ui/section';
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
      <Section
        description={`Kế hoạch sẽ tự động bị xóa vĩnh viễn sau ${PLAN_ARCHIVE_RETENTION_DAYS} ngày kể từ ngày lưu trữ, trừ khi bạn khôi phục lại.`}
        eyebrow="Lưu trữ"
        title="Kế hoạch đã lưu trữ"
      />

      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}

      <EntityList
        empty={plans.length === 0 ? <EmptyState title="Không có kế hoạch nào đã lưu trữ." /> : undefined}
        loading={
          isLoading ? (
            <div className="grid gap-4">
              <Skeleton className="h-28 rounded-[24px]" />
              <Skeleton className="h-28 rounded-[24px]" />
            </div>
          ) : undefined
        }
      >
        {plans.map((plan) => (
          <ArchivedPlanListItem key={plan.id} plan={plan} userId={user?.uid ?? ''} />
        ))}
      </EntityList>
    </main>
  );
}
