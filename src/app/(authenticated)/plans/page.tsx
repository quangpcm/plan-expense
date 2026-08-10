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
    <main className="relative flex flex-col gap-4 bg-[#f7f9fb]">
      <Breadcrumbs items={[{ label: 'Kế hoạch' }]} />

      <Card className="gap-1 border-[#e0e3e5] bg-white">
        <h1 className="text-2xl font-bold text-[#191c1e]">{greeting}</h1>
        <p className="text-sm leading-6 text-[#424656]">
          Quản lý và theo dõi các kế hoạch tài chính của bạn.
        </p>
      </Card>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#727687]" />
          <Input
            className="border-[#c2c6d8] pl-10 text-[#191c1e] placeholder:text-[#727687]"
            placeholder="Tìm kiếm kế hoạch..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <div className="relative shrink-0">
          <ArrowUpDown className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#727687]" />
          <select
            aria-label="Sắp xếp kế hoạch"
            className="h-11 rounded-2xl border border-[#c2c6d8] bg-white pl-9 pr-3 text-sm text-[#191c1e] outline-none focus:border-[#0050cb]"
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
        <div className="rounded-[24px] border border-dashed border-[#c2c6d8] bg-white p-5 text-sm leading-7 text-[#424656]">
          Không tìm thấy kế hoạch phù hợp với &ldquo;{searchQuery.trim()}&rdquo;.
        </div>
      ) : (
        <div className="grid gap-4 pb-24">
          <CreatePlanCard />
        </div>
      )}

      <Link
        aria-label="Tạo kế hoạch"
        className="fixed right-4 bottom-24 z-20 flex size-14 items-center justify-center rounded-full bg-[#0050cb] text-white shadow-[0_12px_30px_rgba(0,80,203,0.4)] transition hover:bg-[#003fa4]"
        href="/plans/new"
      >
        <Plus className="size-6" />
      </Link>
    </main>
  );
}
