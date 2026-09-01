'use client';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import type { DebtTrackingSummary, MemberDebtAggregate, MemberDebtSnapshot } from '@/modules/debt-tracking/types/debt-tracking';
import { DebtDetail, DebtList } from '@/modules/debt-tracking';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatCompactCurrency } from '@/shared/utils/currency';

type DebtTrackingTabProps = {
  aggregates: MemberDebtAggregate[];
  detailSnapshot: MemberDebtSnapshot | null;
  errorMessage: string | null;
  isLoading: boolean;
  members: PlanMemberDocument[];
  onSelect: (snapshot: MemberDebtSnapshot) => void;
  summary: DebtTrackingSummary;
};

export function DebtTrackingTab({
  aggregates,
  detailSnapshot,
  errorMessage,
  isLoading,
  members,
  onSelect,
  summary,
}: DebtTrackingTabProps) {
  const detailAggregate =
    detailSnapshot
      ? aggregates.find((aggregate) => aggregate.snapshot.memberId === detailSnapshot.memberId) ?? null
      : null;

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Khoản vay"
        title="Sổ công nợ theo thành viên"
        description="Tổng hợp từ các khoản chi và khoản thu trong debt mode để biết mỗi thành viên đã mượn bao nhiêu, trả bao nhiêu và còn thiếu bao nhiêu."
      />
      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            Dư nợ còn lại
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
            {formatCompactCurrency(summary.outstandingAmount)}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            Tổng số tiền còn lại sau khi trừ toàn bộ khoản hoàn trả đã ghi nhận.
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            Đã cho mượn
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
            {formatCompactCurrency(summary.totalLentAmount)}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            Tổng số tiền bạn đã chi ra để cho các thành viên trong plan mượn.
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            Đã được hoàn trả
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-expense)]">
            {formatCompactCurrency(summary.totalRepaidAmount)}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            {summary.transactionCount} giao dịch liên quan, {summary.activeCounterpartCount} thành viên còn dư nợ, {summary.settledCounterpartCount} thành viên đã cân bằng.
          </p>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-52 rounded-[28px]" />
          ) : (
            <DebtList
              members={members}
              snapshots={aggregates.map((aggregate) => aggregate.snapshot)}
              onSelect={onSelect}
            />
          )}
        </div>
        <div className="space-y-4">
          {detailAggregate ? (
            <DebtDetail
              members={members}
              snapshot={detailAggregate.snapshot}
              transactions={detailAggregate.transactions}
            />
          ) : (
            <Card className="border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] shadow-none">
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                Chọn một thành viên để xem snapshot công nợ và lịch sử giao dịch liên quan.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
