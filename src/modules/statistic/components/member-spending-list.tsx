import { ChevronRight } from 'lucide-react';

import { Card } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/currency';
import type { StatisticResult } from '@/modules/statistic/types/statistic';

type MemberSpendingListProps = {
  statistic: StatisticResult;
  onSelectMember: (memberId: string) => void;
};

export function MemberSpendingList({ statistic, onSelectMember }: MemberSpendingListProps) {
  const rows = [...statistic.memberBalances].sort((a, b) => b.paid - a.paid);

  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-950">Chi tiêu theo thành viên</h3>
      <div className="grid gap-3">
        {rows.map((row) => (
          <button
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm transition hover:border-slate-300 hover:bg-slate-50"
            key={row.memberId}
            onClick={() => onSelectMember(row.memberId)}
            type="button"
          >
            <span className="font-medium text-slate-900">{row.nickname}</span>
            <span className="flex items-center gap-1 text-slate-600">
              {formatCurrency(row.paid)}
              <ChevronRight className="size-4 text-slate-400" />
            </span>
          </button>
        ))}
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Chưa có dữ liệu chi tiêu để phân tích.
          </div>
        ) : null}
      </div>
    </Card>
  );
}
