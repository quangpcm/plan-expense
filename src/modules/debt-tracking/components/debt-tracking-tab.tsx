'use client';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import type { DebtTrackingSummary, DebtDocument, RepaymentDocument } from '@/modules/debt-tracking/types/debt-tracking';
import { DebtDetail, DebtList } from '@/modules/debt-tracking';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatCompactCurrency } from '@/shared/utils/currency';

type DebtTrackingTabProps = {
  canManage: boolean;
  debts: DebtDocument[];
  detailDebt: DebtDocument | null;
  errorMessage: string | null;
  isLoading: boolean;
  members: PlanMemberDocument[];
  onCreate: () => void;
  onRecordRepayment: (debt: DebtDocument) => void;
  onSelect: (debt: DebtDocument) => void;
  repaymentTotalsByDebtId: Record<string, number>;
  repayments: RepaymentDocument[];
  summary: DebtTrackingSummary;
};

export function DebtTrackingTab({
  canManage,
  debts,
  detailDebt,
  errorMessage,
  isLoading,
  members,
  onCreate,
  onRecordRepayment,
  onSelect,
  repaymentTotalsByDebtId,
  repayments,
  summary,
}: DebtTrackingTabProps) {
  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Khoản vay"
        title="Theo dõi vay và hoàn trả"
        description="Theo dõi các khoản vay, số tiền còn lại và lịch sử hoàn trả theo thời gian thực."
      />
      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
            Dư nợ còn lại
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {formatCompactCurrency(summary.outstandingAmount)}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Tổng số tiền còn outstanding sau khi trừ toàn bộ repayment đã ghi nhận.
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
            Tổng gốc
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {formatCompactCurrency(summary.totalPrincipalAmount)}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Tổng principal của toàn bộ khoản vay đang được theo dõi trong plan.
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
            Đã hoàn trả
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-income)]">
            {formatCompactCurrency(summary.totalRepaidAmount)}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {summary.repaymentCount} giao dịch hoàn trả, {summary.activeDebtCount} khoản đang mở, {summary.paidDebtCount} khoản đã tất toán.
          </p>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-52 rounded-[28px]" />
          ) : (
            <DebtList
              canManage={canManage}
              debts={debts}
              members={members}
              onCreate={onCreate}
              onRecordRepayment={onRecordRepayment}
              onSelect={onSelect}
              repaymentTotalsByDebtId={repaymentTotalsByDebtId}
            />
          )}
        </div>
        <div className="space-y-4">
          {detailDebt ? (
            <DebtDetail debt={detailDebt} members={members} repayments={repayments} />
          ) : (
            <Card className="border-slate-200 bg-slate-50 shadow-none">
              <p className="text-sm leading-6 text-slate-600">
                Chọn một khoản vay để xem chi tiết và lịch sử hoàn trả.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
