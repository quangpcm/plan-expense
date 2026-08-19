'use client';

import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MemberDebtSnapshot } from '@/modules/debt-tracking/types/debt-tracking';
import { Card } from '@/shared/components/ui/card';
import { formatCompactCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type DebtListProps = {
  snapshots: MemberDebtSnapshot[];
  members: PlanMemberDocument[];
  onSelect: (snapshot: MemberDebtSnapshot) => void;
};

export function DebtList({
  snapshots,
  members,
  onSelect,
}: DebtListProps) {
  if (snapshots.length === 0) {
    return (
      <Card className="border-slate-200 bg-slate-50 shadow-none">
        <p className="text-sm leading-6 text-slate-600">
          Chưa có công nợ nào được suy ra từ finance. Hãy tạo khoản chi khi bạn cho mượn tiền hoặc khoản thu khi thành viên trả lại tiền.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {snapshots.map((snapshot) => {
        const counterpart = members.find((member) => member.id === snapshot.memberId);
        const lastTransactionAt = timestampToDate(snapshot.lastTransactionAt);

        return (
          <Card className="gap-3" key={snapshot.memberId}>
            <button className="min-w-0 text-left" onClick={() => onSelect(snapshot)} type="button">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold text-slate-950">
                    {counterpart?.nickname ?? 'Chưa rõ thành viên'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {snapshot.outstandingAmount > 0 ? 'Còn đang nợ bạn' : 'Đã cân bằng công nợ'}
                  </p>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {lastTransactionAt ? formatDate(lastTransactionAt) : 'Chưa có ngày'}
                </p>
              </div>
              <div className="grid gap-2 pt-3 md:grid-cols-3">
                <p className="text-sm text-slate-600">Đã cho mượn: {formatCompactCurrency(snapshot.totalLentAmount)}</p>
                <p className="text-sm text-slate-600">Đã trả: {formatCompactCurrency(snapshot.totalRepaidAmount)}</p>
                <p className="text-sm font-medium text-slate-900">Còn thiếu: {formatCompactCurrency(snapshot.outstandingAmount)}</p>
              </div>
            </button>
          </Card>
        );
      })}
    </div>
  );
}
