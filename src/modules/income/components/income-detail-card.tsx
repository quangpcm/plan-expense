import { History, Landmark, UserRoundPlus } from 'lucide-react';

import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateTime } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import type { Category } from '@/modules/category/types/category';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import type { IncomeDocument } from '@/modules/income/types/income';

type IncomeDetailCardProps = {
  income: IncomeDocument;
  members: PlanMemberDocument[];
  categories: Category[];
  milestones: MilestoneDocument[];
};

export function IncomeDetailCard({ income, members, categories, milestones }: IncomeDetailCardProps) {
  const category = categories.find((item) => item.id === income.categoryId);
  const contributor = members.find((member) => member.id === income.contributedByMemberId);
  const createdBy = members.find((member) => member.id === income.createdByMemberId);
  const milestone = milestones.find((item) => item.id === income.milestoneId);
  const receivedAt = timestampToDate(income.receivedAt);
  const createdAt = timestampToDate(income.createdAt);
  const updatedAt = timestampToDate(income.updatedAt);
  const isEdited = Boolean(createdAt && updatedAt && updatedAt.getTime() !== createdAt.getTime());

  return (
    <Card className="gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-950">{income.title}</h1>
          <div className="flex flex-wrap gap-2">
            {milestone ? <Badge variant="neutral">{milestone.title}</Badge> : null}
            <Badge variant="info">{category?.name || 'Không có danh mục'}</Badge>
          </div>
        </div>
        <p className="text-2xl font-semibold text-emerald-700">+{formatCurrency(income.amount)}</p>
      </div>
      <div className="space-y-2 rounded-[24px] bg-slate-50 p-4 text-sm">
        <div className="flex items-center gap-2 text-slate-800">
          <Landmark className="size-4 shrink-0 text-slate-400" />
          <span>
            <span className="font-medium">{contributor?.nickname || 'Không rõ'}</span> đã nạp ·{' '}
            {receivedAt ? formatDateTime(receivedAt) : 'Không rõ'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <UserRoundPlus className="size-4 shrink-0 text-slate-400" />
          <span>
            Tạo bởi {createdBy?.nickname || 'Không rõ'} ·{' '}
            {createdAt ? formatDateTime(createdAt) : 'Không rõ'}
          </span>
        </div>
        {isEdited && updatedAt ? (
          <div className="flex items-center gap-2 text-slate-500">
            <History className="size-4 shrink-0 text-slate-400" />
            <span>Cập nhật lần cuối · {formatDateTime(updatedAt)}</span>
          </div>
        ) : null}
      </div>
      {income.note ? (
        <div className="space-y-2 rounded-[24px] bg-slate-50 p-4 text-sm leading-7 text-slate-700">
          Ghi chú: {income.note}
        </div>
      ) : null}
    </Card>
  );
}
