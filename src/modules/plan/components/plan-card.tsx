import Link from 'next/link';
import { CalendarPlus, Lock } from 'lucide-react';

import { planCardVisualsByType } from '@/modules/plan/constants/plan-card-visuals';
import type { PlanSummary } from '@/modules/plan/types/plan';
import { buildPlanCardViewModel } from '@/modules/plan/utils/build-plan-card-view-model';
import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { cn } from '@/shared/utils/cn';

type PlanCardProps = {
  plan: PlanSummary;
};

export function PlanCard({ plan }: PlanCardProps) {
  const visual = planCardVisualsByType[plan.planType];
  const PlanTypeIcon = visual.icon;
  const viewModel = buildPlanCardViewModel(plan);
  const progressPercent = viewModel.progress
    ? Math.min(Math.max((viewModel.progress.value / viewModel.progress.max) * 100, 0), 100)
    : 0;
  const secondaryDetail = viewModel.secondaryMetric.detail;

  return (
    <Link className="block" href={`/plans/${plan.planId}`}>
      <Card className="gap-4 rounded-[24px] border-[rgba(198,205,218,0.7)] bg-white shadow-[0_16px_40px_rgba(20,36,64,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(23,32,51,0.08)]">
        <div className="flex items-center justify-between gap-3">
          {viewModel.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external Cloudflare R2 URL, next/image domain not configured yet
            <img
              alt=""
              className="size-11 shrink-0 rounded-full object-cover"
              src={viewModel.coverImageUrl}
            />
          ) : (
            <div
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]',
                visual.iconBgClassName,
                visual.iconFgClassName,
              )}
            >
              <PlanTypeIcon className="size-5" />
            </div>
          )}
          <div className="flex shrink-0 gap-2">
            {plan.role === 'owner' ? null : (
              <Badge className="border border-[var(--color-border)] bg-[var(--color-surface)] uppercase tracking-[0.08em] text-[var(--color-secondary-foreground)]">
                {viewModel.roleLabel}
              </Badge>
            )}
            {viewModel.statusTone === 'active' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-success-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-success)]">
                <span className="size-2 rounded-full bg-[var(--color-success)]" />
                Active
              </span>
            ) : (
              <Badge className="bg-[var(--color-secondary)] text-[var(--color-muted)]">
                {viewModel.statusLabel}
              </Badge>
            )}
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="truncate text-lg font-semibold text-[var(--color-foreground)]">{viewModel.title}</h2>
          {plan.isLocked ? (
            <div className="flex items-center gap-2 text-lg font-semibold text-[var(--color-muted)]">
              <Lock className="size-4 shrink-0" />
              Đã khóa cho tôi
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)]">
                    {viewModel.primaryMetric.label}
                  </p>
                  <p
                    className={cn('truncate text-2xl font-bold text-[var(--color-foreground)]', {
                      [visual.accentTextClassName]: (viewModel.primaryMetric.tone ?? 'default') === 'primary',
                      'text-[var(--color-success)]': viewModel.primaryMetric.tone === 'success',
                      'text-[color:var(--color-warning)]': viewModel.primaryMetric.tone === 'warning',
                      'text-[color:var(--color-danger)]': viewModel.primaryMetric.tone === 'danger',
                    })}
                  >
                    {viewModel.primaryMetric.value}
                  </p>
                  {viewModel.primaryMetric.detail ? (
                    <p className="truncate text-xs text-[var(--color-muted)]">{viewModel.primaryMetric.detail}</p>
                  ) : null}
                </div>
                <div className="min-w-0 space-y-1 text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-subtle)]">
                    {viewModel.secondaryMetric.label}
                  </p>
                  <p
                    className={cn('truncate text-lg font-semibold text-[var(--color-foreground)]', {
                      [visual.accentTextClassName]: (viewModel.secondaryMetric.tone ?? 'default') === 'primary',
                      'text-[var(--color-success)]': viewModel.secondaryMetric.tone === 'success',
                      'text-[color:var(--color-warning)]': viewModel.secondaryMetric.tone === 'warning',
                      'text-[color:var(--color-danger)]': viewModel.secondaryMetric.tone === 'danger',
                    })}
                  >
                    {viewModel.secondaryMetric.value}
                  </p>
                </div>
              </div>

              {viewModel.progress ? (
                <div className="space-y-2">
                  <div className={cn('h-2 overflow-hidden rounded-full', visual.progressTrackClassName)}>
                    <div
                      className={cn('h-full rounded-full transition-[width]', visual.progressFillClassName)}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs text-[var(--color-muted)]">
                    <p className="min-w-0 truncate">{viewModel.progress.label}</p>
                    {secondaryDetail ? <p className="shrink-0 text-right">{secondaryDetail}</p> : null}
                  </div>
                </div>
              ) : secondaryDetail ? <p className="text-xs text-[var(--color-muted)]">{secondaryDetail}</p> : null}
            </>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-subtle)]">
          <span className="inline-flex items-center gap-1">
            <CalendarPlus className="size-3.5" />
            <span>{viewModel.footerLeft.label}</span>
            <span className="font-medium text-[var(--color-muted)]">{viewModel.footerLeft.value}</span>
          </span>
          <span>
            {viewModel.footerRight.label}{' '}
            <span className="font-medium text-[var(--color-muted)]">{viewModel.footerRight.value}</span>
          </span>
        </div>
      </Card>
    </Link>
  );
}
