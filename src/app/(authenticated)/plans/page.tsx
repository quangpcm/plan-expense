'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { ArrowUpDown, Bell, Plus, Search } from 'lucide-react';

import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { useUserPlans } from '@/modules/plan/hooks/use-user-plans';
import { CreatePlanCard } from '@/modules/plan/components/create-plan-card';
import { CreatePlanForm } from '@/modules/plan/components/create-plan-form';
import { PlanCard } from '@/modules/plan/components/plan-card';
import { TodoNotificationScreen } from '@/modules/todo/components/todo-notification-screen';
import { TodoAttentionSection } from '@/modules/todo/components/todo-attention-section';
import { useAttentionTodos, type AttentionBellTone } from '@/modules/todo/hooks/use-attention-todos';
import { useCurrentUserProfile } from '@/modules/user/hooks/use-current-user-profile';
import { Avatar } from '@/shared/components/ui/avatar';
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

function getBellToneClass(tone: AttentionBellTone) {
  if (tone === 'urgent') {
    return 'border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:text-rose-700';
  }

  if (tone === 'warning') {
    return 'border-amber-200 bg-amber-50 text-amber-600 hover:border-amber-300 hover:text-amber-700';
  }

  return 'border-[var(--color-border)] bg-white text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]';
}

export default function PlansPage() {
  const router = useRouter();
  const { user } = useAuthSession();
  const { userProfile } = useCurrentUserProfile();
  const { plans, isLoading, errorMessage } = useUserPlans();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showCreatePlanForm, setShowCreatePlanForm] = useState(false);
  const greeting = `Xin chào, ${user?.displayName || user?.email?.split('@')[0] || 'bạn'} 👋`;
  const userInitials = (user?.displayName || user?.email?.split('@')[0] || 'PE').slice(0, 2).toUpperCase();
  const { todayAttentionCount, bellTone } = useAttentionTodos(plans);

  const filteredPlans = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matched = query ? plans.filter((plan) => plan.planName.toLowerCase().includes(query)) : plans;

    return [...matched].sort((a, b) => b[sortBy].toMillis() - a[sortBy].toMillis());
  }, [plans, searchQuery, sortBy]);

  return (
    <main className="relative flex flex-col gap-4 bg-[var(--color-background)]">
      <section className="space-y-4 px-1">
        <PageHeader
          actions={
            <>
              <button
                aria-label="Thông báo"
                className={`relative inline-flex size-11 items-center justify-center rounded-full border shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition ${getBellToneClass(bellTone)}`}
                onClick={() => setIsNotificationOpen(true)}
                type="button"
              >
                <Bell className="size-5" />
                {todayAttentionCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white shadow-[0_8px_18px_rgba(244,63,94,0.35)]">
                    {todayAttentionCount > 9 ? '9+' : todayAttentionCount}
                  </span>
                ) : null}
              </button>
              <Avatar
                className="size-11 shadow-[0_10px_24px_rgba(43,94,242,0.2)]"
                initials={userInitials}
                src={userProfile?.avatarUrl ?? user?.photoURL ?? null}
              />
            </>
          }
          description="Quản lý và theo dõi kế hoạch tài chính."
          title={greeting}
        />

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
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-subtle)]" />
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
        <div className="rounded-[24px] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-5 text-sm leading-7 text-[var(--color-muted)]">
          Không tìm thấy kế hoạch phù hợp với &ldquo;{searchQuery.trim()}&rdquo;.
        </div>
      ) : (
        <div className="grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-3">
          <CreatePlanCard onClick={() => setShowCreatePlanForm(true)} />
        </div>
      )}

      <button
        aria-label="Tạo kế hoạch"
        className="fixed right-4 bottom-24 z-20 flex size-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-[0_14px_34px_rgba(36,59,107,0.32)] transition hover:bg-[var(--color-primary-hover)] lg:bottom-6"
        onClick={() => setShowCreatePlanForm(true)}
        type="button"
      >
        <Plus className="size-6" />
      </button>

      <TodoNotificationScreen open={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} plans={plans} />

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
