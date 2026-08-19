'use client';

import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { CounterpartyDebtLedger } from '@/modules/debt-tracking/calculators/debt-calculators';
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

export function DebtNativeList({ ledgers, members, selectedMemberId, onSelect }: DebtNativeListProps) {
  if (ledgers.length === 0) {
    return (
      <Card className="border-slate-200 bg-slate-50 shadow-none">
        <p className="text-sm leading-6 text-slate-600">
          Chưa có khoản nợ nào. Ghi nhận khoản vay đầu tiên để bắt đầu theo dõi.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {ledgers.map((ledger) => {
        const counterpart = members.find((member) => member.id === ledger.counterpartyMemberId);
        const lastTransactionAt = timestampToDate(ledger.lastTransactionAt);
        const isSelected = ledger.counterpartyMemberId === selectedMemberId;

        return (
          <Card
            className={cn('gap-3', isSelected ? 'border-[#0050cb]' : undefined)}
            key={ledger.counterpartyMemberId}
          >
            <button
              className="min-w-0 text-left"
              onClick={() => onSelect(ledger.counterpartyMemberId)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold text-slate-950">
                    {counterpart?.nickname ?? 'Chưa rõ đối tượng'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Net {ledger.netPosition >= 0 ? '+' : ''}
                    {formatCompactCurrency(ledger.netPosition)}
                  </p>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {lastTransactionAt ? formatDate(lastTransactionAt) : 'Chưa có ngày'}
                </p>
              </div>
              <div className="grid gap-2 pt-3 md:grid-cols-2">
                <p className="text-sm text-slate-600">
                  Phải thu: {formatCompactCurrency(ledger.receivableOutstanding)}
                </p>
                <p className="text-sm text-slate-600">
                  Phải trả: {formatCompactCurrency(ledger.payableOutstanding)}
                </p>
              </div>
            </button>
          </Card>
        );
      })}
    </div>
  );
}
