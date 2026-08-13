'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { ArrowUpDown, Plus, Search } from 'lucide-react';

import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { useUserPlans } from '@/modules/plan/hooks/use-user-plans';
import { CreatePlanCard } from '@/modules/plan/components/create-plan-card';
import { PlanCard } from '@/modules/plan/components/plan-card';
import { Breadcrumbs } from '@/shared/components/ui/breadcrumbs';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Skeleton } from '@/shared/components/ui/skeleton';

type SortOption = 'updatedAt' | 'createdAt';

export default function PlansPage() {
  const { user } = useAuthSession();
  const { plans, isLoading, errorMessage } = useUserPlans();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const greeting = `Xin chào, ${user?.displayName || user?.email?.split('@')[0] || 'bạn'} 👋`;

  const filteredPlans = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matched = query ? plans.filter((plan) => plan.planName.toLowerCase().includes(query)) : plans;

    return [...matched].sort((a, b) => b[sortBy].toMillis() - a[sortBy].toMillis());
  }, [plans, searchQuery, sortBy]);

  return (
    <main className="relative flex flex-col gap-4 bg-[var(--color-background)]">
      <Breadcrumbs items={[{ label: 'Kế hoạch' }]} />

      <Card className="gap-1">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{greeting}</h1>
        <p className="text-sm leading-6 text-[var(--color-muted)]">
          Quản lý và theo dõi các kế hoạch tài chính của bạn.
        </p>
      </Card>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-subtle)]" />
          <Input
            className="pl-10"
            placeholder="Tìm kiếm kế hoạch..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <div className="relative shrink-0">
          <ArrowUpDown className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-subtle)]" />
          <select
            aria-label="Sắp xếp kế hoạch"
            className="h-11 appearance-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent-soft)]"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
          >
            <option value="updatedAt">Mới nhất</option>
            <option value="createdAt">Ngày tạo</option>
          </select>
        </div>
      </div>

      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}

      {isLoading ? (
        <div className="grid gap-4">
          <Skeleton className="h-44 rounded-[28px]" />
          <Skeleton className="h-44 rounded-[28px]" />
        </div>
      ) : filteredPlans.length > 0 ? (
        <div className="grid gap-4 pb-24">
          {filteredPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
          <CreatePlanCard />
        </div>
      ) : plans.length > 0 ? (
        <div className="rounded-[24px] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-5 text-sm leading-7 text-[var(--color-muted)]">
          Không tìm thấy kế hoạch phù hợp với &ldquo;{searchQuery.trim()}&rdquo;.
        </div>
      ) : (
        <div className="grid gap-4 pb-24">
          <CreatePlanCard />
        </div>
      )}

      <Link
        aria-label="Tạo kế hoạch"
        className="fixed right-4 bottom-24 z-20 flex size-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-[0_14px_34px_rgba(36,59,107,0.32)] transition hover:bg-[var(--color-primary-hover)]"
        href="/plans/new"
      >
        <Plus className="size-6" />
      </Link>
    </main>
  );
}
