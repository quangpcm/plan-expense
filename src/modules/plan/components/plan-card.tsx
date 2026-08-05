import Link from 'next/link';

import type { PlanSummary } from '@/modules/plan/types/plan';
import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type PlanCardProps = {
  plan: PlanSummary;
};

export function PlanCard({ plan }: PlanCardProps) {
  const lastActivityDate = timestampToDate(plan.lastActivityAt);
  const joinedDate = timestampToDate(plan.joinedAt);

  return (
    <Link className="block" href={`/plans/${plan.planId}`}>
      <Card className="gap-4 transition hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-950">{plan.planName}</h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">{plan.role}</Badge>
              <Badge>{plan.planType.replace('_', ' ')}</Badge>
            </div>
          </div>
          <Badge variant={plan.planStatus === 'active' ? 'success' : 'neutral'}>{plan.planStatus}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-[24px] bg-slate-50 p-4 text-sm text-slate-600">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Last update</p>
            <p className="mt-1 font-medium text-slate-800">
              {lastActivityDate ? formatDate(lastActivityDate) : 'Syncing...'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Joined</p>
            <p className="mt-1 font-medium text-slate-800">
              {joinedDate ? formatDate(joinedDate) : 'Just now'}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
