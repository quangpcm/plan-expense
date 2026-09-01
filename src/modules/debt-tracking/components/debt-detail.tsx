'use client';

import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { MemberDebtSnapshot, MemberDebtTransaction } from '@/modules/debt-tracking/types/debt-tracking';
import { Card } from '@/shared/components/ui/card';
import { formatCompactCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type DebtDetailProps = {
  snapshot: MemberDebtSnapshot;
  transactions: MemberDebtTransaction[];
  members: PlanMemberDocument[];
};

export function DebtDetail({ snapshot, transactions, members }: DebtDetailProps) {
  const counterpart = members.find((member) => member.id === snapshot.memberId);

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">{counterpart?.nickname ?? 'Chưa rõ thành viên'}</p>
          <p className="text-sm text-[var(--color-text-muted)]">
            {snapshot.outstandingAmount > 0 ? 'Đang còn công nợ' : 'Đã cân bằng công nợ'}
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <p className="text-sm text-[var(--color-text-secondary)]">Đã cho mượn: {formatCompactCurrency(snapshot.totalLentAmount)}</p>
          <p className="text-sm text-[var(--color-text-secondary)]">Đã trả: {formatCompactCurrency(snapshot.totalRepaidAmount)}</p>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Còn thiếu: {formatCompactCurrency(snapshot.outstandingAmount)}</p>
        </div>
        {snapshot.lastTransactionAt ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            Giao dịch gần nhất: {formatDate(timestampToDate(snapshot.lastTransactionAt) ?? new Date())}
          </p>
        ) : null}
      </Card>
      <Card>
        <p className="text-sm font-medium text-[var(--color-text-primary)]">Lịch sử giao dịch</p>
        <div className="mt-2 space-y-3">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div className="rounded-2xl border border-[var(--color-border-subtle)] p-4" key={transaction.transactionId}>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {transaction.kind === 'expense' ? 'Cho mượn' : 'Đã trả'} · {formatCompactCurrency(transaction.amount)}
                </p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {formatDate(timestampToDate(transaction.occurredAt) ?? new Date())}
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{transaction.title}</p>
                {transaction.note ? <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{transaction.note}</p> : null}
              </div>
            ))
          ) : (
            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">Chưa có giao dịch finance nào liên quan đến thành viên này.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
