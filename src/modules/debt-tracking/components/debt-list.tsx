'use client';

import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { DebtDocument } from '@/modules/debt-tracking/types/debt-tracking';
import {
  formatDebtDirectionLabel,
  resolveDebtCounterpart,
  resolveDebtDirection,
} from '@/modules/debt-tracking/utils/debt-perspective';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { formatCompactCurrency } from '@/shared/utils/currency';

type DebtListProps = {
  debts: DebtDocument[];
  repaymentTotalsByDebtId: Record<string, number>;
  members: PlanMemberDocument[];
  currentMemberId: string | null;
  canManage: boolean;
  onCreate: () => void;
  onSelect: (debt: DebtDocument) => void;
  onRecordRepayment: (debt: DebtDocument) => void;
};

export function DebtList({
  debts,
  repaymentTotalsByDebtId,
  members,
  currentMemberId,
  canManage,
  onCreate,
  onSelect,
  onRecordRepayment,
}: DebtListProps) {
  if (debts.length === 0) {
    return (
      <Card className="border-slate-200 bg-slate-50 shadow-none">
        <p className="text-sm leading-6 text-slate-600">
          Chưa có khoản vay nào được theo dõi trong plan này.
        </p>
        {canManage ? (
          <div>
            <Button onClick={onCreate} variant="secondary">
              Tạo khoản vay
            </Button>
          </div>
        ) : null}
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {canManage ? (
        <div className="flex justify-end">
          <Button onClick={onCreate}>Tạo khoản vay</Button>
        </div>
      ) : null}
      {debts.map((debt) => {
        const direction = resolveDebtDirection(debt, currentMemberId);
        const counterpart = resolveDebtCounterpart(debt, members, currentMemberId);
        const repaidAmount = repaymentTotalsByDebtId[debt.id] ?? 0;
        const remainingAmount = Math.max(debt.principalAmount - repaidAmount, 0);

        return (
          <Card className="gap-3" key={debt.id}>
            <div className="flex items-start justify-between gap-3">
              <button className="min-w-0 flex-1 text-left" onClick={() => onSelect(debt)} type="button">
                <p className="text-lg font-semibold text-slate-950">{debt.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {formatDebtDirectionLabel(direction)} · {counterpart?.nickname ?? 'Chưa rõ thành viên còn lại'}
                </p>
              </button>
              {canManage && debt.status !== 'paid' ? (
                <Button onClick={() => onRecordRepayment(debt)} variant="ghost">
                  Trả nợ
                </Button>
              ) : null}
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <p className="text-sm text-slate-600">Gốc: {formatCompactCurrency(debt.principalAmount)}</p>
              <p className="text-sm text-slate-600">Đã trả: {formatCompactCurrency(repaidAmount)}</p>
              <p className="text-sm font-medium text-slate-900">Còn lại: {formatCompactCurrency(remainingAmount)}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
