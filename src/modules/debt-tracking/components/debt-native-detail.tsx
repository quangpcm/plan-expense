'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { CounterpartyDebtLedger } from '@/modules/debt-tracking/calculators/debt-calculators';
import type { DebtDirection, DebtTransaction } from '@/modules/debt-tracking/types/debt-transaction';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { formatCompactCurrency } from '@/shared/utils/currency';
import { formatDate } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';

type DebtNativeDetailProps = {
  ledger: CounterpartyDebtLedger;
  counterpart: PlanMemberDocument | undefined;
  transactions: DebtTransaction[];
  onRecordLoan: () => void;
  onRecordRepayment: (direction: DebtDirection) => void;
  onEditTransaction: (transaction: DebtTransaction) => void;
  onDeleteTransaction: (transaction: DebtTransaction) => void;
};

function TransactionRow({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: DebtTransaction;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const occurredAt = timestampToDate(transaction.occurredAt) ?? new Date();
  const isLoan = transaction.type === 'loan';
  const label = isLoan
    ? transaction.direction === 'receivable'
      ? 'Cho vay'
      : 'Tôi vay'
    : transaction.direction === 'receivable'
      ? 'Đã trả'
      : 'Tôi trả';

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">
            {label} · {isLoan ? '+' : '-'}
            {formatCompactCurrency(transaction.amount)}
          </p>
          <p className="mt-1 text-sm text-slate-500">{formatDate(occurredAt)}</p>
          {transaction.dueDate ? (
            <p className="mt-1 text-xs text-slate-500">
              Hạn trả: {formatDate(timestampToDate(transaction.dueDate) ?? occurredAt)}
            </p>
          ) : null}
          {transaction.note ? <p className="mt-1 text-sm leading-6 text-slate-600">{transaction.note}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isConfirmingDelete ? (
            <>
              <button
                className="rounded-full px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                onClick={onDelete}
                type="button"
              >
                Xác nhận xoá
              </button>
              <button
                className="rounded-full px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
                onClick={() => setIsConfirmingDelete(false)}
                type="button"
              >
                Huỷ
              </button>
            </>
          ) : (
            <>
              <button
                aria-label="Sửa giao dịch"
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                onClick={onEdit}
                type="button"
              >
                <Pencil className="size-4" />
              </button>
              <button
                aria-label="Xoá giao dịch"
                className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                onClick={() => setIsConfirmingDelete(true)}
                type="button"
              >
                <Trash2 className="size-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LedgerSection({
  title,
  direction,
  outstanding,
  transactions,
  onRecordRepayment,
  onEditTransaction,
  onDeleteTransaction,
}: {
  title: string;
  direction: DebtDirection;
  outstanding: number;
  transactions: DebtTransaction[];
  onRecordRepayment: (direction: DebtDirection) => void;
  onEditTransaction: (transaction: DebtTransaction) => void;
  onDeleteTransaction: (transaction: DebtTransaction) => void;
}) {
  const directionTransactions = transactions.filter((transaction) => transaction.direction === direction);

  if (directionTransactions.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        {outstanding > 0 ? (
          <Button
            className="min-h-0 px-3 py-1.5 text-xs"
            onClick={() => onRecordRepayment(direction)}
            type="button"
            variant="ghost"
          >
            + Ghi nhận đã trả
          </Button>
        ) : null}
      </div>
      <p className="text-2xl font-semibold text-slate-950">{formatCompactCurrency(outstanding)}</p>
      <div className="space-y-3">
        {directionTransactions.map((transaction) => (
          <TransactionRow
            key={transaction.id}
            onDelete={() => onDeleteTransaction(transaction)}
            onEdit={() => onEditTransaction(transaction)}
            transaction={transaction}
          />
        ))}
      </div>
    </Card>
  );
}

export function DebtNativeDetail({
  ledger,
  counterpart,
  transactions,
  onRecordLoan,
  onRecordRepayment,
  onEditTransaction,
  onDeleteTransaction,
}: DebtNativeDetailProps) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-950">{counterpart?.nickname ?? 'Chưa rõ đối tượng'}</p>
            <p className="mt-1 text-sm text-slate-500">
              Net {ledger.netPosition >= 0 ? '+' : ''}
              {formatCompactCurrency(ledger.netPosition)}
            </p>
          </div>
          <Button className="min-h-0 px-3 py-1.5 text-xs" onClick={onRecordLoan} type="button">
            + Ghi khoản nợ
          </Button>
        </div>
      </Card>

      <LedgerSection
        direction="receivable"
        onDeleteTransaction={onDeleteTransaction}
        onEditTransaction={onEditTransaction}
        onRecordRepayment={onRecordRepayment}
        outstanding={ledger.receivableOutstanding}
        title="Người khác nợ tôi"
        transactions={transactions}
      />

      <LedgerSection
        direction="payable"
        onDeleteTransaction={onDeleteTransaction}
        onEditTransaction={onEditTransaction}
        onRecordRepayment={onRecordRepayment}
        outstanding={ledger.payableOutstanding}
        title="Tôi nợ người khác"
        transactions={transactions}
      />
    </div>
  );
}
