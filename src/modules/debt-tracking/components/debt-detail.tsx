'use client';

import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { DebtDocument, RepaymentDocument } from '@/modules/debt-tracking/types/debt-tracking';
import {
  formatDebtDirectionLabel,
  resolveDebtCounterpart,
  resolveDebtDirection,
} from '@/modules/debt-tracking/utils/debt-perspective';
import { Card } from '@/shared/components/ui/card';
import { formatCompactCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type DebtDetailProps = {
  debt: DebtDocument;
  repayments: RepaymentDocument[];
  members: PlanMemberDocument[];
  currentMemberId: string | null;
};

export function DebtDetail({ debt, repayments, members, currentMemberId }: DebtDetailProps) {
  const direction = resolveDebtDirection(debt, currentMemberId);
  const counterpart = resolveDebtCounterpart(debt, members, currentMemberId);
  const debtRepayments = repayments.filter((repayment) => repayment.debtId === debt.id);
  const repaidAmount = debtRepayments.reduce((total, repayment) => total + repayment.amount, 0);
  const remainingAmount = Math.max(debt.principalAmount - repaidAmount, 0);

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-slate-950">{debt.title}</p>
          <p className="text-sm text-slate-500">
            {formatDebtDirectionLabel(direction)} · {counterpart?.nickname ?? 'Chưa rõ thành viên còn lại'}
          </p>
        </div>
        {debt.note ? <p className="text-sm leading-6 text-slate-600">{debt.note}</p> : null}
        <div className="grid gap-2 md:grid-cols-3">
          <p className="text-sm text-slate-600">Gốc: {formatCompactCurrency(debt.principalAmount)}</p>
          <p className="text-sm text-slate-600">Đã trả: {formatCompactCurrency(repaidAmount)}</p>
          <p className="text-sm font-medium text-slate-900">Còn lại: {formatCompactCurrency(remainingAmount)}</p>
        </div>
        {debt.dueDate ? (
          <p className="text-sm text-slate-500">
            Hạn trả: {formatDate(timestampToDate(debt.dueDate) ?? new Date())}
          </p>
        ) : null}
      </Card>
      <Card>
        <p className="text-sm font-medium text-slate-900">Lịch sử hoàn trả</p>
        <div className="mt-2 space-y-3">
          {debtRepayments.length > 0 ? (
            debtRepayments.map((repayment) => (
              <div className="rounded-2xl border border-slate-200 p-4" key={repayment.id}>
                <p className="text-sm font-medium text-slate-900">
                  {formatCompactCurrency(repayment.amount)}
                </p>
                <p className="text-sm text-slate-500">
                  {formatDate(timestampToDate(repayment.paidAt) ?? new Date())}
                </p>
                {repayment.note ? <p className="mt-1 text-sm leading-6 text-slate-600">{repayment.note}</p> : null}
              </div>
            ))
          ) : (
            <p className="text-sm leading-6 text-slate-600">Chưa có giao dịch hoàn trả nào cho khoản vay này.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
