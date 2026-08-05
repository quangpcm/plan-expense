'use client';

import { BellDot, Plus, Search } from 'lucide-react';

import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { useUserPlans } from '@/modules/plan/hooks/use-user-plans';
import { PlanCard } from '@/modules/plan/components/plan-card';
import { Avatar } from '@/shared/components/ui/avatar';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { Skeleton } from '@/shared/components/ui/skeleton';

export default function PlansPage() {
  const { user } = useAuthSession();
  const { plans, isLoading } = useUserPlans();
  const greeting = `Hi, ${user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there'}`;

  return (
    <main className="flex flex-col gap-5">
      <Card className="overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_70%)]" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              Dashboard
            </p>
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold text-slate-950">{greeting}</h1>
              <p className="text-sm leading-6 text-slate-600">
                Create and browse shared plans here. This dashboard is now connected to your
                realtime `userPlans` index.
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
            <Input className="pl-10" placeholder="Search plans" />
          </div>
          <Button className="shrink-0" variant="secondary">
            <BellDot className="size-4" />
          </Button>
        </div>
        <SectionHeading
          eyebrow="Plans"
          title="Your shared plans"
          description="Search, create, and open plans. Each card reads from the dashboard index optimized for the current user."
        />
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
            No plans yet.
            <br />
            Create your first shared plan to start tracking members and expenses together.
          </div>
        )}
        <div className="flex justify-end">
          <Button href="/plans/new">
            <Plus className="size-4" />
            Create Plan
          </Button>
        </div>
      </Card>
    </main>
  );
}
