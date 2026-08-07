import Link from 'next/link';
import { CalendarPlus } from 'lucide-react';

import { planTypeBadgeColors, planTypeIcons } from '@/modules/plan/constants/plan.constants';
import type { PlanSummary } from '@/modules/plan/types/plan';
import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate, formatRelativeTime } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type PlanCardProps = {
  plan: PlanSummary;
};

export function PlanCard({ plan }: PlanCardProps) {
  const lastActivityDate = timestampToDate(plan.lastActivityAt);
  const createdDate = timestampToDate(plan.createdAt);
  const PlanTypeIcon = planTypeIcons[plan.planType];

  return (
    <Link className="block" href={`/plans/${plan.planId}`}>
      <Card className="gap-4 border-[#e0e3e5] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between gap-3">
          {plan.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external Firebase Storage URL, next/image domain not configured yet
            <img
              alt=""
              className="size-11 shrink-0 rounded-full object-cover"
              src={plan.coverImageUrl}
            />
          ) : (
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-full text-white ${planTypeBadgeColors[plan.planType]}`}
            >
              <PlanTypeIcon className="size-5" />
            </div>
          )}
          <div className="flex shrink-0 gap-2">
            <Badge className="border border-[#c2c6d8] bg-white text-[#424656]">{plan.role}</Badge>
            <Badge
              className={
                plan.planStatus === 'active'
                  ? 'bg-[#0050cb]/10 text-[#0050cb]'
                  : 'bg-[#eceef0] text-[#52606d]'
              }
            >
              {plan.planStatus}
            </Badge>
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="truncate text-lg font-semibold text-[#191c1e]">{plan.planName}</h2>
          <p className="text-2xl font-bold text-[#0050cb]">{formatCurrency(plan.totalExpense)}</p>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[#e0e3e5] pt-3 text-xs text-[#727687]">
          <span className="inline-flex items-center gap-1">
            <CalendarPlus className="size-3.5" />
            <span className="font-medium text-[#424656]">
              {createdDate ? formatDate(createdDate) : 'Đang đồng bộ...'}
            </span>
          </span>
          <span>
            Cập nhật{' '}
            <span className="font-medium text-[#424656]">
              {lastActivityDate ? formatRelativeTime(lastActivityDate) : 'vừa xong'}
            </span>
          </span>
        </div>
      </Card>
    </Link>
  );
}
