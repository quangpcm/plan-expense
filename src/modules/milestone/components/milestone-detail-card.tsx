import { CalendarDays, CircleDollarSign, ListChecks } from 'lucide-react';

import type { MilestoneDocument } from '@/modules/milestone/types/milestone';
import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type MilestoneDetailCardProps = {
  milestone: MilestoneDocument;
};

const milestoneStatusLabel: Record<MilestoneDocument['status'], string> = {
  upcoming: 'Sắp tới',
  in_progress: 'Đang làm',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export function MilestoneDetailCard({ milestone }: MilestoneDetailCardProps) {
  const startDate = timestampToDate(milestone.startDate);
  const endDate = timestampToDate(milestone.endDate);
  const progress =
    milestone.todoCount > 0 ? Math.round((milestone.completedTodoCount / milestone.todoCount) * 100) : 0;

  return (
    <Card className="gap-4 border-slate-200 bg-slate-50 shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-950">{milestone.title}</h3>
          <p className="text-sm leading-6 text-slate-600">
            {milestone.description || 'Chưa có mô tả cho mốc kế hoạch này.'}
          </p>
        </div>
        <Badge variant={milestone.status === 'completed' ? 'success' : milestone.status === 'cancelled' ? 'neutral' : 'info'}>
          {milestoneStatusLabel[milestone.status]}
        </Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-400">
            <CalendarDays className="size-3.5" />
            Thời gian
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {startDate ? formatDate(startDate) : 'Chưa đặt'} - {endDate ? formatDate(endDate) : 'Chưa đặt'}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-400">
            <CircleDollarSign className="size-3.5" />
            Chi tiêu
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900">{formatCurrency(milestone.totalExpense)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {milestone.budgetAmount != null ? `Ngân sách: ${formatCurrency(milestone.budgetAmount)}` : 'Chưa đặt ngân sách'}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-400">
            <ListChecks className="size-3.5" />
            Tiến độ
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {milestone.completedTodoCount}/{milestone.todoCount} việc
          </p>
          <p className="mt-1 text-xs text-slate-500">{progress}% hoàn thành</p>
        </div>
      </div>
    </Card>
  );
}
