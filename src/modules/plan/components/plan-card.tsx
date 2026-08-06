import Link from 'next/link';

import { planTypeIcons } from '@/modules/plan/constants/plan.constants';
import type { PlanSummary } from '@/modules/plan/types/plan';
import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { formatRelativeTime } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type PlanCardProps = {
  plan: PlanSummary;
};

export function PlanCard({ plan }: PlanCardProps) {
  const lastActivityDate = timestampToDate(plan.lastActivityAt);
  const PlanTypeIcon = planTypeIcons[plan.planType];

  return (
    <Link className="block" href={`/plans/${plan.planId}`}>
      <Card className="gap-4 transition hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {plan.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external Firebase Storage URL, next/image domain not configured yet
              <img
                alt=""
                className="size-11 shrink-0 rounded-2xl object-cover"
                src={plan.coverImageUrl}
              />
            ) : (
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <PlanTypeIcon className="size-5" />
              </div>
            )}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-950">{plan.planName}</h2>
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">{plan.role}</Badge>
                <Badge>{plan.planType.replace('_', ' ')}</Badge>
              </div>
            </div>
          </div>
          <Badge variant={plan.planStatus === 'active' ? 'success' : 'neutral'}>{plan.planStatus}</Badge>
        </div>
        <p className="text-sm text-slate-500">
          Cập nhật {lastActivityDate ? formatRelativeTime(lastActivityDate) : 'vừa xong'}
        </p>
      </Card>
    </Link>
  );
}
