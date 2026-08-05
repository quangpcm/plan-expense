'use client';

import { BellDot, Plus, Search } from 'lucide-react';

import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { useUserPlans } from '@/modules/plan/hooks/use-user-plans';
import { PlanCard } from '@/modules/plan/components/plan-card';
import { Avatar } from '@/shared/components/ui/avatar';
import { Breadcrumbs } from '@/shared/components/ui/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { Skeleton } from '@/shared/components/ui/skeleton';

export default function PlansPage() {
  const { user } = useAuthSession();
  const { plans, isLoading, errorMessage } = useUserPlans();
  const greeting = `Chào ${user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'bạn'}`;

  return (
    <main className="flex flex-col gap-5">
      <Breadcrumbs items={[{ label: 'Kế hoạch' }]} />
      <Card className="overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_70%)]" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              Tổng quan
            </p>
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold text-slate-950">{greeting}</h1>
              <p className="text-sm leading-6 text-slate-600">
                Tạo và xem các kế hoạch dùng chung tại đây. Màn hình này đang đồng bộ realtime từ
                `userPlans` của bạn.
              </p>
            </div>
          </div>
          <Avatar initials={(user?.displayName || user?.email || 'PE').slice(0, 2).toUpperCase()} />
        </div>
      </Card>

      <Card className="gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-10" placeholder="Tìm kiếm kế hoạch" />
          </div>
          <Button className="shrink-0" variant="secondary">
            <BellDot className="size-4" />
          </Button>
        </div>
        <SectionHeading
          eyebrow="Kế hoạch"
          title="Danh sách kế hoạch của bạn"
          description="Tìm kiếm, tạo mới và mở các kế hoạch. Mỗi thẻ được lấy từ dashboard index tối ưu cho người dùng hiện tại."
        />
        {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
        {isLoading ? (
          <div className="grid gap-4">
            <Skeleton className="h-44 rounded-[28px]" />
            <Skeleton className="h-44 rounded-[28px]" />
          </div>
        ) : plans.length > 0 ? (
          <div className="grid gap-4">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
            Chưa có kế hoạch nào.
            <br />
            Hãy tạo kế hoạch đầu tiên để bắt đầu quản lý thành viên và chi tiêu chung.
          </div>
        )}
        <div className="flex justify-end">
          <Button href="/plans/new">
            <Plus className="size-4" />
            Tạo kế hoạch
          </Button>
        </div>
      </Card>
    </main>
  );
}
