'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { ArrowUpDown, Bell, Plus, Search } from 'lucide-react';

import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { useUserPlans } from '@/modules/plan/hooks/use-user-plans';
import { CreatePlanCard } from '@/modules/plan/components/create-plan-card';
import { PlanCard } from '@/modules/plan/components/plan-card';
import { TodoNotificationScreen } from '@/modules/todo/components/todo-notification-screen';
import { TodoAttentionSection } from '@/modules/todo/components/todo-attention-section';
import { useAttentionTodos, type AttentionBellTone } from '@/modules/todo/hooks/use-attention-todos';
import { useCurrentUserProfile } from '@/modules/user/hooks/use-current-user-profile';
import { Avatar } from '@/shared/components/ui/avatar';
import { Input } from '@/shared/components/ui/input';
import { Skeleton } from '@/shared/components/ui/skeleton';

type SortOption = 'updatedAt' | 'createdAt';

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
  const { user } = useAuthSession();
  const { userProfile } = useCurrentUserProfile();
  const { plans, isLoading, errorMessage } = useUserPlans();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
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
      <section
        className="space-y-4 px-1"
        style={{ paddingTop: 'max(0.25rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-[2rem] font-bold leading-tight text-[var(--color-foreground)]">{greeting}</h1>
            <p className="text-sm leading-6 text-[var(--color-muted)]">Quản lý và theo dõi kế hoạch tài chính.</p>
          </div>
          <div className="flex shrink-0 items-center gap-3 pt-1">
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
              className="size-11 text-base shadow-[0_10px_24px_rgba(43,94,242,0.2)]"
              initials={userInitials}
              src={userProfile?.avatarUrl ?? user?.photoURL ?? null}
            />
          </div>
        </div>

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
              className="h-11 appearance-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-xs text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent-soft)]"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
            >
              <option value="updatedAt">Mới nhất</option>
              <option value="createdAt">Ngày tạo</option>
            </select>
          </div>
        </div>
      </section>

      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}

      {isLoading ? (
        <div className="grid gap-4">
          <Skeleton className="h-44 rounded-[28px]" />
          <Skeleton className="h-44 rounded-[28px]" />
        </div>
      ) : filteredPlans.length > 0 ? (
        <div className="grid gap-4 pb-24">
          <TodoAttentionSection plans={plans} />
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

      <TodoNotificationScreen open={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} plans={plans} />
    </main>
  );
}
