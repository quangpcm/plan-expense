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

const MASKED_MONEY_VALUE = '•••••••';

function getMaskedValue(value: string, shouldMask: boolean) {
  return shouldMask ? MASKED_MONEY_VALUE : value;
}

function getMaskedMoneyClassName(shouldMask: boolean, size: 'primary' | 'secondary' | 'detail' = 'secondary') {
  if (!shouldMask) {
    return null;
  }

  if (size === 'primary') {
    return 'tracking-[0.18em] text-[color:color-mix(in_srgb,var(--color-text-muted)_95%,transparent)]';
  }

  if (size === 'secondary') {
    return 'tracking-[0.16em] text-[color:color-mix(in_srgb,var(--color-text-muted)_90%,transparent)]';
  }

  return 'tracking-[0.14em] text-[color:color-mix(in_srgb,var(--color-text-muted)_85%,transparent)]';
}

export function PlanCard({ plan }: PlanCardProps) {
  const visual = planCardVisualsByType[plan.planType];
  const PlanTypeIcon = visual.icon;
  const viewModel = buildPlanCardViewModel(plan);
  const progressPercent = viewModel.progress
    ? Math.min(Math.max((viewModel.progress.value / viewModel.progress.max) * 100, 0), 100)
    : 0;
  const secondaryDetail = viewModel.secondaryMetric.detail;
  const isMoneyMasked = plan.isLocked;

  return (
    <Link className="block" href={`/plans/${plan.planId}`}>
      <Card className="gap-4 rounded-[24px] border-[rgba(198,205,218,0.7)] bg-[var(--color-surface-default)] shadow-[0_16px_40px_rgba(20,36,64,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(23,32,51,0.08)]">
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
              <Badge className="border border-[var(--color-border-default)] bg-[var(--color-surface-default)] uppercase tracking-[0.08em] text-[var(--color-secondary-foreground)]">
                {viewModel.roleLabel}
              </Badge>
            )}
            {plan.isLocked ? (
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[var(--color-text-muted)]">
                <Lock className="size-3.5" />
              </span>
            ) : null}
            {viewModel.statusTone === 'active' ? (
              <Badge className="gap-1.5" variant="success">
                <span className="size-2 rounded-full bg-[var(--color-status-success)]" />
                Đang chạy
              </Badge>
            ) : (
              <Badge className="inline-flex items-center gap-1.5 bg-[var(--color-secondary)] text-[var(--color-text-muted)]">
                {viewModel.statusLabel}
              </Badge>
            )}
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="truncate text-lg font-semibold text-[var(--color-text-primary)]">{viewModel.title}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                {viewModel.primaryMetric.label}
              </p>
              <p
                className={cn('truncate text-2xl font-bold text-[var(--color-text-primary)]', {
                  [visual.accentTextClassName]: (viewModel.primaryMetric.tone ?? 'default') === 'primary',
                  'text-[var(--color-success)]': viewModel.primaryMetric.tone === 'success',
                  'text-[color:var(--color-warning)]': viewModel.primaryMetric.tone === 'warning',
                  'text-[color:var(--color-danger)]': viewModel.primaryMetric.tone === 'danger',
                }, getMaskedMoneyClassName(isMoneyMasked && Boolean(viewModel.primaryMetric.isMonetary), 'primary'))}
              >
                {getMaskedValue(viewModel.primaryMetric.value, isMoneyMasked && Boolean(viewModel.primaryMetric.isMonetary))}
              </p>
              {viewModel.primaryMetric.detail ? (
                <p
                  className={cn(
                    'truncate text-xs text-[var(--color-text-muted)]',
                    getMaskedMoneyClassName(isMoneyMasked && Boolean(viewModel.primaryMetric.detailIsMonetary), 'detail'),
                  )}
                >
                  {getMaskedValue(
                    viewModel.primaryMetric.detail,
                    isMoneyMasked && Boolean(viewModel.primaryMetric.detailIsMonetary),
                  )}
                </p>
              ) : null}
            </div>
            <div className="min-w-0 space-y-1 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                {viewModel.secondaryMetric.label}
              </p>
              <p
                className={cn('truncate text-lg font-semibold text-[var(--color-text-primary)]', {
                  [visual.accentTextClassName]: (viewModel.secondaryMetric.tone ?? 'default') === 'primary',
                  'text-[var(--color-success)]': viewModel.secondaryMetric.tone === 'success',
                  'text-[color:var(--color-warning)]': viewModel.secondaryMetric.tone === 'warning',
                  'text-[color:var(--color-danger)]': viewModel.secondaryMetric.tone === 'danger',
                }, getMaskedMoneyClassName(isMoneyMasked && Boolean(viewModel.secondaryMetric.isMonetary), 'secondary'))}
              >
                {getMaskedValue(
                  viewModel.secondaryMetric.value,
                  isMoneyMasked && Boolean(viewModel.secondaryMetric.isMonetary),
                )}
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
              <div className="flex items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
                <p
                  className={cn(
                    'min-w-0 truncate',
                    getMaskedMoneyClassName(isMoneyMasked && Boolean(viewModel.progress.isMonetary), 'detail'),
                  )}
                >
                  {getMaskedValue(viewModel.progress.label, isMoneyMasked && Boolean(viewModel.progress.isMonetary))}
                </p>
                {secondaryDetail ? (
                  <p
                    className={cn(
                      'shrink-0 text-right',
                      getMaskedMoneyClassName(isMoneyMasked && Boolean(viewModel.secondaryMetric.detailIsMonetary), 'detail'),
                    )}
                  >
                    {getMaskedValue(
                      secondaryDetail,
                      isMoneyMasked && Boolean(viewModel.secondaryMetric.detailIsMonetary),
                    )}
                  </p>
                ) : null}
              </div>
            </div>
          ) : secondaryDetail ? (
            <p
              className={cn(
                'text-xs text-[var(--color-text-muted)]',
                getMaskedMoneyClassName(isMoneyMasked && Boolean(viewModel.secondaryMetric.detailIsMonetary), 'detail'),
              )}
            >
              {getMaskedValue(secondaryDetail, isMoneyMasked && Boolean(viewModel.secondaryMetric.detailIsMonetary))}
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border-default)] pt-3 text-xs text-[var(--color-text-muted)]">
          <span className="inline-flex items-center gap-1">
            <CalendarPlus className="size-3.5" />
            <span>{viewModel.footerLeft.label}</span>
            <span className="font-medium text-[var(--color-text-muted)]">{viewModel.footerLeft.value}</span>
          </span>
          <span>
            {viewModel.footerRight.label}{' '}
            <span className="font-medium text-[var(--color-text-muted)]">{viewModel.footerRight.value}</span>
          </span>
        </div>
      </Card>
    </Link>
  );
}
