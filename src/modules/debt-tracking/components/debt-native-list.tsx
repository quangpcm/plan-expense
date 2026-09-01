'use client';

import { ChevronRight } from 'lucide-react';

import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { CounterpartyDebtLedger } from '@/modules/debt-tracking/calculators/debt-calculators';
import { Avatar } from '@/shared/components/ui/avatar';
import { Card } from '@/shared/components/ui/card';
import { formatCompactCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import { cn } from '@/shared/utils/cn';

type DebtNativeListProps = {
  ledgers: CounterpartyDebtLedger[];
  members: PlanMemberDocument[];
  selectedMemberId: string | null;
  onSelect: (memberId: string) => void;
};

function resolveLedgerStatusLabel(ledger: CounterpartyDebtLedger): string {
  if (ledger.receivableOutstanding === 0 && ledger.payableOutstanding === 0) {
    return 'Đã tất toán';
  }

  return ledger.netPosition >= 0 ? 'Bạn cần thu' : 'Bạn cần trả';
}

export function DebtNativeList({
  ledgers,
  members,
  selectedMemberId,
  onSelect,
}: DebtNativeListProps) {
  if (ledgers.length === 0) {
    return (
      <Card className="border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] shadow-none">
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
          Chưa có khoản nợ nào. Ghi nhận khoản vay đầu tiên để bắt đầu theo dõi.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {ledgers.map((ledger) => {
        const counterpart = members.find(
          (member) => member.id === ledger.counterpartyMemberId,
        );
        const lastTransactionAt = timestampToDate(ledger.lastTransactionAt);
        const isSelected = ledger.counterpartyMemberId === selectedMemberId;

        return (
          <Card
            className={cn('gap-3', isSelected ? 'border-[var(--color-border-focus)]' : undefined)}
            key={ledger.counterpartyMemberId}
          >
            <button
              className="min-w-0 text-left"
              onClick={() => onSelect(ledger.counterpartyMemberId)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar
                    initials={(counterpart?.nickname ?? '?')
                      .slice(0, 2)
                      .toUpperCase()}
                    src={counterpart?.avatarUrl ?? null}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-[var(--color-text-primary)]">
                      {counterpart?.nickname ?? 'Chưa rõ đối tượng'}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                      {resolveLedgerStatusLabel(ledger)}
                    </p>
                  </div>
                </div>
                <p
                  className={cn(
                    'shrink-0 text-base font-semibold',
                    ledger.netPosition >= 0
                      ? 'text-[color:var(--color-income)]'
                      : 'text-[color:var(--color-expense)]',
                  )}
                >
                  {ledger.netPosition >= 0 ? '+' : ''}
                  {formatCompactCurrency(ledger.netPosition)}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-3">
                <p className="text-xs text-[var(--color-text-muted)]">
                  {lastTransactionAt
                    ? `Cập nhật ${formatDate(lastTransactionAt)}`
                    : 'Chưa có ngày'}
                </p>
                <ChevronRight className="size-4 shrink-0 text-[var(--color-text-muted)]" />
              </div>
            </button>
          </Card>
        );
      })}
    </div>
  );
}
