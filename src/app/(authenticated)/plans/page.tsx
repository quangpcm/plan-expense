'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { ArrowUpDown, Plus, Search } from 'lucide-react';

import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { useUserPlans } from '@/modules/plan/hooks/use-user-plans';
import { CreatePlanCard } from '@/modules/plan/components/create-plan-card';
import { CreatePlanForm } from '@/modules/plan/components/create-plan-form';
import { PlanCard } from '@/modules/plan/components/plan-card';
import { TodoAttentionSection } from '@/modules/todo/components/todo-attention-section';
import { DropdownSelect, type DropdownOption } from '@/shared/components/ui/dropdown-select';
import { ErrorState } from '@/shared/components/ui/error-state';
import { FilterBar } from '@/shared/components/ui/filter-bar';
import { Input } from '@/shared/components/ui/input';
import { PageHeader } from '@/shared/components/ui/page-header';
import { ResponsiveModal } from '@/shared/components/ui/responsive-modal';
import { Skeleton } from '@/shared/components/ui/skeleton';

type SortOption = 'updatedAt' | 'createdAt';

const sortOptions: DropdownOption[] = [
  { value: 'updatedAt', label: 'Mới nhất', icon: ArrowUpDown },
  { value: 'createdAt', label: 'Ngày tạo', icon: ArrowUpDown },
];

export default function PlansPage() {
  const router = useRouter();
  const { user } = useAuthSession();
  const { plans, isLoading, errorMessage } = useUserPlans();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const [showCreatePlanForm, setShowCreatePlanForm] = useState(false);
  const greeting = `Xin chào, ${user?.displayName || user?.email?.split('@')[0] || 'bạn'} 👋`;

  const filteredPlans = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matched = query ? plans.filter((plan) => plan.planName.toLowerCase().includes(query)) : plans;

    return [...matched].sort((a, b) => b[sortBy].toMillis() - a[sortBy].toMillis());
  }, [plans, searchQuery, sortBy]);

  return (
    <main className="relative flex flex-col gap-4 bg-[var(--color-surface-page)]">
      <section className="space-y-4 px-1">
        <PageHeader description="Quản lý và theo dõi kế hoạch tài chính." title={greeting} />

        <FilterBar
          filters={
            <div className="relative shrink-0">
              <label className="sr-only" htmlFor="plan-sort">
                Sắp xếp kế hoạch
              </label>
              <DropdownSelect
                id="plan-sort"
                onValueChange={(value) => setSortBy(value as SortOption)}
                options={sortOptions}
                value={sortBy}
              />
            </div>
          }
          search={
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <Input
                className="pl-10"
                placeholder="Tìm kiếm kế hoạch..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          }
        />
      </section>

      {errorMessage ? <ErrorState title={errorMessage} /> : null}

      {isLoading ? (
        <div className="grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-44 rounded-[28px]" />
          <Skeleton className="h-44 rounded-[28px]" />
          <Skeleton className="h-44 rounded-[28px]" />
        </div>
      ) : filteredPlans.length > 0 ? (
        <div className="grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <TodoAttentionSection plans={plans} />
          </div>
          {filteredPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
          <CreatePlanCard onClick={() => setShowCreatePlanForm(true)} />
        </div>
      ) : plans.length > 0 ? (
        <div className="rounded-[24px] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-default)] p-5 text-sm leading-7 text-[var(--color-text-muted)]">
          Không tìm thấy kế hoạch phù hợp với &ldquo;{searchQuery.trim()}&rdquo;.
        </div>
      ) : (
        <div className="grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-3">
          <CreatePlanCard onClick={() => setShowCreatePlanForm(true)} />
        </div>
      )}

      <button
        aria-label="Tạo kế hoạch"
        className="fixed right-4 bottom-24 z-20 flex size-14 items-center justify-center rounded-full bg-[var(--color-brand-primary)] text-[var(--color-brand-foreground)] shadow-[0_14px_34px_rgba(81,71,229,0.32)] transition hover:bg-[var(--color-brand-primary-hover)] active:bg-[var(--color-brand-primary-active)] lg:bottom-6"
        onClick={() => setShowCreatePlanForm(true)}
        type="button"
      >
        <Plus className="size-6" />
      </button>

      <ResponsiveModal
        onOpenChange={setShowCreatePlanForm}
        open={showCreatePlanForm}
        title="Tạo kế hoạch mới"
      >
        <CreatePlanForm
          onCancel={() => setShowCreatePlanForm(false)}
          onSuccess={(planId) => {
            setShowCreatePlanForm(false);
            router.push(`/plans/${planId}`);
          }}
        />
      </ResponsiveModal>
    </main>
  );
}
