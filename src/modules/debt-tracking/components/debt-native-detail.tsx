'use client';

import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Clock, Paperclip, Pencil, Trash2 } from 'lucide-react';

import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { CounterpartyDebtLedger } from '@/modules/debt-tracking/calculators/debt-calculators';
import {
  categoryIconMap,
  getDebtTransactionCategoryLabel,
} from '@/modules/debt-tracking/constants/debt-transaction-category';
import type { DebtDirection, DebtTransaction } from '@/modules/debt-tracking/types/debt-transaction';
import { Avatar } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { formatCompactCurrency } from '@/shared/utils/currency';
import { formatDate, formatDateTimePickerDisplay } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import { cn } from '@/shared/utils/cn';

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
  const isReceivable = transaction.direction === 'receivable';
  const label = isLoan ? (isReceivable ? 'Cho vay' : 'Tôi vay') : isReceivable ? 'Đã trả' : 'Tôi trả';
  // Quy ước màu: xanh/mũi tên vào = tiền nhận về (Tôi vay, Đã trả); đỏ/mũi tên ra = tiền đưa đi (Cho vay, Tôi trả).
  // Độc lập với chiều công nợ (receivable/payable) — chiều đó đã được phân biệt bằng section riêng.
  const isCashIn = (isLoan && !isReceivable) || (!isLoan && isReceivable);
  const CashFlowIcon = isCashIn ? ArrowDownLeft : ArrowUpRight;
  const CategoryIcon = categoryIconMap[transaction.category ?? 'other'] ?? categoryIconMap.other;

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full',
            isCashIn
              ? 'bg-[color:var(--color-income-soft)] text-[color:var(--color-income)]'
              : 'bg-[color:var(--color-expense-soft)] text-[color:var(--color-expense)]',
          )}
        >
          <CashFlowIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium text-slate-900">{transaction.title || label}</p>
            <div className="flex shrink-0 items-center gap-1">
              <p
                className={cn(
                  'text-sm font-semibold',
                  isCashIn ? 'text-[color:var(--color-income)]' : 'text-[color:var(--color-expense)]',
                )}
              >
                {isCashIn ? '+' : '-'}
                {formatCompactCurrency(transaction.amount)}
              </p>
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
          <Badge className="mt-1 gap-1 px-2 py-0.5" variant="neutral">
            <CategoryIcon className="size-3" />
            {getDebtTransactionCategoryLabel(transaction.category)}
          </Badge>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
            <Clock className="size-3.5 shrink-0" />
            <span>{formatDateTimePickerDisplay(occurredAt)}</span>
            {isLoan && transaction.dueDate ? (
              <span className="text-[color:var(--color-warning)]">
                · Hạn trả: {formatDate(timestampToDate(transaction.dueDate) ?? occurredAt)}
              </span>
            ) : null}
            {transaction.attachments.length > 0 ? (
              <span className="flex shrink-0 items-center gap-1">
                · <Paperclip className="size-3.5" />
                {transaction.attachments.length}
              </span>
            ) : null}
          </div>
          {transaction.note ? <p className="mt-1 text-sm leading-6 text-slate-400">{transaction.note}</p> : null}
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

  const isReceivable = direction === 'receivable';

  return (
    <Card>
      <p className="text-sm text-slate-500">{title}</p>
      <div className="flex items-center justify-between gap-3">
        <p
          className={cn(
            'text-2xl font-semibold',
            isReceivable ? 'text-[color:var(--color-income)]' : 'text-[color:var(--color-expense)]',
          )}
        >
          {formatCompactCurrency(outstanding)}
        </p>
        {outstanding > 0 ? (
          <Button
            className="min-h-0 border border-[var(--color-border-strong)] bg-white px-3 py-1.5 text-xs text-[var(--color-primary)]"
            onClick={() => onRecordRepayment(direction)}
            type="button"
            variant="ghost"
          >
            + Ghi nhận đã trả
          </Button>
        ) : null}
      </div>
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
  const counterpartName = counterpart?.nickname ?? 'người này';

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-3">
          <Avatar
            className="size-12"
            initials={(counterpart?.nickname ?? '?').slice(0, 2).toUpperCase()}
            src={counterpart?.avatarUrl ?? null}
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-slate-950">
              {counterpart?.nickname ?? 'Chưa rõ đối tượng'}
            </p>
            <p className="mt-0.5 text-sm">
              <span
                className={cn(
                  'font-semibold',
                  ledger.netPosition >= 0 ? 'text-[color:var(--color-income)]' : 'text-[color:var(--color-expense)]',
                )}
              >
                {ledger.netPosition >= 0 ? '+' : ''}
                {formatCompactCurrency(ledger.netPosition)}
              </span>
            </p>
          </div>
        </div>
        <Button
          className="min-h-0 w-fit border border-[var(--color-border-strong)] bg-white px-3 py-1.5 text-xs text-[var(--color-primary)]"
          onClick={onRecordLoan}
          type="button"
          variant="ghost"
        >
          + Ghi khoản nợ
        </Button>
      </Card>

      <LedgerSection
        direction="receivable"
        onDeleteTransaction={onDeleteTransaction}
        onEditTransaction={onEditTransaction}
        onRecordRepayment={onRecordRepayment}
        outstanding={ledger.receivableOutstanding}
        title={`${counterpartName} nợ tôi`}
        transactions={transactions}
      />

      <LedgerSection
        direction="payable"
        onDeleteTransaction={onDeleteTransaction}
        onEditTransaction={onEditTransaction}
        onRecordRepayment={onRecordRepayment}
        outstanding={ledger.payableOutstanding}
        title={`Tôi nợ ${counterpartName}`}
        transactions={transactions}
      />
    </div>
  );
}
