'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowUp,
  ArrowUpRight,
  CalendarRange,
  Clock,
  Paperclip,
  Pencil,
  Trash2,
  type LucideIcon,
} from 'lucide-react';

import type { PlanMemberDocument } from '@/modules/member/types/member';
import {
  isDebtTransactionCashIn,
  type CounterpartyDebtLedger,
} from '@/modules/debt-tracking/calculators/debt-calculators';
import {
  categoryIconMap,
  getDebtTransactionCategoryLabel,
} from '@/modules/debt-tracking/constants/debt-transaction-category';
import type {
  DebtDirection,
  DebtTransaction,
} from '@/modules/debt-tracking/types/debt-transaction';
import {
  DEFAULT_DATE_RANGE_FILTER,
  dateRangePresetOptions,
  isTimestampWithinRange,
  type DateRangeFilter,
  type DateRangePresetKey,
} from '@/modules/debt-tracking/utils/date-range-presets';
import { Avatar } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { DateField } from '@/shared/components/ui/date-field';
import { ResponsiveModal } from '@/shared/components/ui/responsive-modal';
import { formatCompactCurrency } from '@/shared/utils/currency';
import { formatDate, formatDateTimePickerDisplay } from '@/shared/utils/date';
import { timestampToDate } from '@/shared/utils/firebase';
import { cn } from '@/shared/utils/cn';

const TRANSACTIONS_PAGE_SIZE = 10;

// Local-timezone-safe (không dùng toISOString, vốn quy đổi UTC nên có thể lệch ngày
// với người dùng ở múi giờ dương như VN).
function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDateInputValue(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

type DebtNativeDetailProps = {
  ledger: CounterpartyDebtLedger;
  counterpart: PlanMemberDocument | undefined;
  transactions: DebtTransaction[];
  onRecordLoan: (direction: DebtDirection) => void;
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
  const label = isLoan
    ? isReceivable
      ? 'Cho vay'
      : 'Tôi vay'
    : isReceivable
      ? 'Đã trả'
      : 'Tôi trả';
  const isCashIn = isDebtTransactionCashIn(transaction);
  const CashFlowIcon = isCashIn ? ArrowDownLeft : ArrowUpRight;
  const CategoryIcon =
    categoryIconMap[transaction.category ?? 'other'] ?? categoryIconMap.other;

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] p-4">
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
            <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
              {transaction.title || label}
            </p>
            <div className="flex shrink-0 items-center gap-1">
              <p
                className={cn(
                  'text-sm font-semibold',
                  isCashIn
                    ? 'text-[color:var(--color-income)]'
                    : 'text-[color:var(--color-expense)]',
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
                    className="rounded-full px-2 py-1 text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)]"
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
                    className="rounded-full p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-secondary)]"
                    onClick={onEdit}
                    type="button"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    aria-label="Xoá giao dịch"
                    className="rounded-full p-1.5 text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-600"
                    onClick={() => setIsConfirmingDelete(true)}
                    type="button"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </>
              )}
            </div>
          </div>
          {isLoan ? (
            <Badge className="mt-1 gap-1 px-2 py-0.5" variant="neutral">
              <CategoryIcon className="size-3" />
              {getDebtTransactionCategoryLabel(transaction.category)}
            </Badge>
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
            <Clock className="size-3.5 shrink-0" />
            <span>{formatDateTimePickerDisplay(occurredAt)}</span>
            {isLoan && transaction.dueDate ? (
              <span className="text-[color:var(--color-warning)]">
                · Hạn trả:{' '}
                {formatDate(timestampToDate(transaction.dueDate) ?? occurredAt)}
              </span>
            ) : null}
            {transaction.attachments.length > 0 ? (
              <span className="flex shrink-0 items-center gap-1">
                · <Paperclip className="size-3.5" />
                {transaction.attachments.length}
              </span>
            ) : null}
          </div>
          {transaction.note ? (
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
              {transaction.note}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function outstandingFor(
  ledger: CounterpartyDebtLedger,
  direction: DebtDirection,
) {
  return direction === 'receivable'
    ? ledger.receivableOutstanding
    : ledger.payableOutstanding;
}

function hasActivity(ledger: CounterpartyDebtLedger, direction: DebtDirection) {
  return direction === 'receivable'
    ? ledger.receivableLoan > 0 || ledger.receivableRepayment > 0
    : ledger.payableLoan > 0 || ledger.payableRepayment > 0;
}

// Ưu tiên tab "receivable" mặc định; chỉ mở "payable" trước nếu chiều kia chưa có giao dịch nào.
function pickDefaultDirection(ledger: CounterpartyDebtLedger): DebtDirection {
  return !hasActivity(ledger, 'receivable') && hasActivity(ledger, 'payable')
    ? 'payable'
    : 'receivable';
}

// Chỉ gắn dấu +/- khi outstanding dương — tránh hiển thị "-0 đ", và không che dấu
// nếu outstanding lỡ âm (xem ghi chú validateRepaymentAmount) vì formatCompactCurrency
// đã tự in dấu âm.
function formatDirectionAmount(amount: number, direction: DebtDirection) {
  if (amount > 0) {
    return `${direction === 'receivable' ? '+' : '-'}${formatCompactCurrency(amount)}`;
  }

  return formatCompactCurrency(amount);
}

const DIRECTION_TAB_CONFIG: Record<
  DebtDirection,
  { label: string; icon: LucideIcon }
> = {
  receivable: { label: 'Phải thu', icon: ArrowUp },
  payable: { label: 'Phải trả', icon: ArrowDown },
};

function DirectionTab({
  amount,
  direction,
  isActive,
  onClick,
}: {
  amount: number;
  direction: DebtDirection;
  isActive: boolean;
  onClick: () => void;
}) {
  const isReceivable = direction === 'receivable';
  const { label, icon: Icon } = DIRECTION_TAB_CONFIG[direction];

  return (
    <button
      aria-selected={isActive}
      className={cn(
        'flex flex-1 flex-col items-center gap-1.5 rounded-2xl px-4 py-3 text-center transition',
        isActive
          ? isReceivable
            ? 'bg-[color:var(--color-income-soft)]'
            : 'bg-[color:var(--color-expense-soft)]'
          : 'bg-[var(--color-surface-subtle)] hover:bg-[var(--color-surface-subtle)]',
      )}
      onClick={onClick}
      role="tab"
      type="button"
    >
      <span
        className={cn(
          'flex items-center gap-1.5 text-sm font-medium',
          isReceivable
            ? 'text-[color:var(--color-income)]'
            : 'text-[color:var(--color-expense)]',
        )}
      >
        <Icon className="size-3.5" />
        {label}
      </span>
      <span
        className={cn(
          'text-base font-semibold',
          isReceivable
            ? 'text-[color:var(--color-income)]'
            : 'text-[color:var(--color-expense)]',
        )}
      >
        {formatDirectionAmount(amount, direction)}
      </span>
    </button>
  );
}

function formatCustomRangeLabel(
  filter: Extract<DateRangeFilter, { kind: 'custom' }>,
) {
  return `${formatDate(filter.from)} - ${formatDate(filter.to)}`;
}

function DateRangeFilterBar({
  filter,
  onSelectPreset,
  onOpenCustomRange,
}: {
  filter: DateRangeFilter;
  onSelectPreset: (preset: DateRangePresetKey) => void;
  onOpenCustomRange: () => void;
}) {
  const isCustomActive = filter.kind === 'custom';

  return (
    <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1">
      {dateRangePresetOptions.map((option) => {
        const isActive =
          filter.kind === 'preset' && filter.preset === option.value;

        return (
          <button
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition',
              isActive
                ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]'
                : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-default)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-default)]',
            )}
            key={option.value}
            onClick={() => onSelectPreset(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
      <button
        className={cn(
          'flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition',
          isCustomActive
            ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]'
            : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-default)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-default)]',
        )}
        onClick={onOpenCustomRange}
        type="button"
      >
        <CalendarRange className="size-3.5" />
        {isCustomActive ? formatCustomRangeLabel(filter) : 'Tuỳ chọn'}
      </button>
    </div>
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
  const [activeDirection, setActiveDirection] = useState<DebtDirection>(() =>
    pickDefaultDirection(ledger),
  );
  const isReceivable = activeDirection === 'receivable';
  const activeOutstanding = outstandingFor(ledger, activeDirection);
  const activeLoanTotal = isReceivable
    ? ledger.receivableLoan
    : ledger.payableLoan;
  const activeRepaidTotal = isReceivable
    ? ledger.receivableRepayment
    : ledger.payableRepayment;

  // Cố định "now" tại thời điểm mở trang chi tiết — ranh giới tháng/năm không cần trôi
  // theo từng giây, và tránh việc list nhảy giữa lúc user đang xem.
  const [now] = useState(() => new Date());
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>(
    DEFAULT_DATE_RANGE_FILTER,
  );
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false);
  const [customFromInput, setCustomFromInput] = useState('');
  const [customToInput, setCustomToInput] = useState('');
  const [customRangeError, setCustomRangeError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(TRANSACTIONS_PAGE_SIZE);
  // "Adjust state during render" (khuyến nghị của React thay vì useEffect) để reset
  // trang về đầu mỗi khi đổi tab hoặc đổi filter thời gian.
  const [paginationResetKey, setPaginationResetKey] = useState({
    activeDirection,
    dateRangeFilter,
  });

  const activeTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) => transaction.direction === activeDirection,
      ),
    [transactions, activeDirection],
  );

  // Filter theo thời gian chỉ bớt bớt danh sách hiển thị — KHÔNG được dùng để tính lại
  // outstanding/net, vì đó phải luôn phản ánh đúng số nợ thực tế toàn bộ lịch sử.
  const dateFilteredTransactions = useMemo(
    () =>
      activeTransactions.filter((transaction) =>
        isTimestampWithinRange(transaction.occurredAt, dateRangeFilter, now),
      ),
    [activeTransactions, dateRangeFilter, now],
  );

  if (
    paginationResetKey.activeDirection !== activeDirection ||
    paginationResetKey.dateRangeFilter !== dateRangeFilter
  ) {
    setPaginationResetKey({ activeDirection, dateRangeFilter });
    setVisibleCount(TRANSACTIONS_PAGE_SIZE);
  }

  const visibleTransactions = dateFilteredTransactions.slice(0, visibleCount);
  const remainingCount =
    dateFilteredTransactions.length - visibleTransactions.length;

  function openCustomRangeSheet() {
    if (dateRangeFilter.kind === 'custom') {
      setCustomFromInput(toDateInputValue(dateRangeFilter.from));
      setCustomToInput(toDateInputValue(dateRangeFilter.to));
    } else {
      setCustomFromInput(toDateInputValue(now));
      setCustomToInput(toDateInputValue(now));
    }

    setCustomRangeError(null);
    setIsCustomRangeOpen(true);
  }

  function applyCustomRange() {
    if (!customFromInput || !customToInput) {
      setCustomRangeError('Vui lòng chọn đủ ngày bắt đầu và kết thúc.');
      return;
    }

    const from = parseDateInputValue(customFromInput);
    const to = parseDateInputValue(customToInput);

    if (from.getTime() > to.getTime()) {
      setCustomRangeError('Ngày bắt đầu phải trước ngày kết thúc.');
      return;
    }

    setDateRangeFilter({ kind: 'custom', from, to });
    setIsCustomRangeOpen(false);
  }

  return (
    <>
      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex items-start gap-3 p-5">
          <Avatar
            className="size-12"
            initials={(counterpart?.nickname ?? '?').slice(0, 2).toUpperCase()}
            src={counterpart?.avatarUrl ?? null}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-[var(--color-text-primary)]">
              {counterpart?.nickname ?? 'Chưa rõ đối tượng'}
            </p>
            <p
              className={cn(
                'mt-0.5 text-base font-semibold',
                ledger.netPosition >= 0
                  ? 'text-[color:var(--color-income)]'
                  : 'text-[color:var(--color-expense)]',
              )}
            >
              {ledger.netPosition >= 0 ? '+' : ''}
              {formatCompactCurrency(ledger.netPosition)}
            </p>
            <Button
              className="mt-3 min-h-0 w-fit border border-[var(--color-border-strong)] bg-[var(--color-surface-default)] px-3 py-1.5 text-xs text-[var(--color-brand-primary)]"
              onClick={() => onRecordLoan(activeDirection)}
              type="button"
              variant="ghost"
            >
              + Ghi khoản vay
            </Button>
          </div>
        </div>

        <div
          className="flex gap-2 border-t border-[var(--color-border-subtle)] px-4 py-3"
          role="tablist"
        >
          <DirectionTab
            amount={ledger.receivableOutstanding}
            direction="receivable"
            isActive={isReceivable}
            onClick={() => setActiveDirection('receivable')}
          />
          <DirectionTab
            amount={ledger.payableOutstanding}
            direction="payable"
            isActive={!isReceivable}
            onClick={() => setActiveDirection('payable')}
          />
        </div>

        <div className="space-y-3 p-5">
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-3">
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Tổng khoản vay</p>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {formatCompactCurrency(activeLoanTotal)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Đã trả</p>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {formatCompactCurrency(activeRepaidTotal)}
              </p>
            </div>
          </div>

          <DateRangeFilterBar
            filter={dateRangeFilter}
            onOpenCustomRange={openCustomRangeSheet}
            onSelectPreset={(preset) =>
              setDateRangeFilter({ kind: 'preset', preset })
            }
          />

          {activeOutstanding > 0 ? (
            <div className="flex justify-end">
              <Button
                className="min-h-0 border border-[var(--color-border-strong)] bg-[var(--color-surface-default)] px-3 py-1.5 text-xs text-[var(--color-brand-primary)]"
                onClick={() => onRecordRepayment(activeDirection)}
                type="button"
                variant="ghost"
              >
                + Ghi nhận đã trả
              </Button>
            </div>
          ) : null}

          {dateFilteredTransactions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
              {activeTransactions.length === 0
                ? isReceivable
                  ? `Chưa có khoản ${counterpartName} nợ bạn.`
                  : `Bạn chưa nợ ${counterpartName} khoản nào.`
                : 'Không có giao dịch nào trong khoảng thời gian đã chọn.'}
            </p>
          ) : (
            <div className="space-y-3">
              {visibleTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  onDelete={() => onDeleteTransaction(transaction)}
                  onEdit={() => onEditTransaction(transaction)}
                  transaction={transaction}
                />
              ))}
              {remainingCount > 0 ? (
                <button
                  className="w-full rounded-2xl border border-dashed border-[var(--color-border-subtle)] py-2.5 text-sm font-medium text-[var(--color-brand-primary)] transition hover:bg-[var(--color-surface-subtle)]"
                  onClick={() =>
                    setVisibleCount((count) => count + TRANSACTIONS_PAGE_SIZE)
                  }
                  type="button"
                >
                  Xem thêm {Math.min(TRANSACTIONS_PAGE_SIZE, remainingCount)}{' '}
                  giao dịch
                </button>
              ) : null}
            </div>
          )}
        </div>
      </Card>

      <ResponsiveModal
        onOpenChange={setIsCustomRangeOpen}
        open={isCustomRangeOpen}
        title="Chọn khoảng thời gian"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[var(--color-text-secondary)]"
                htmlFor="debt-date-range-from"
              >
                Từ ngày
              </label>
              <DateField
                id="debt-date-range-from"
                onChange={(event) => setCustomFromInput(event.target.value)}
                value={customFromInput}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[var(--color-text-secondary)]"
                htmlFor="debt-date-range-to"
              >
                Đến ngày
              </label>
              <DateField
                id="debt-date-range-to"
                onChange={(event) => setCustomToInput(event.target.value)}
                value={customToInput}
              />
            </div>
          </div>
          {customRangeError ? (
            <p className="text-sm text-red-600">{customRangeError}</p>
          ) : null}
          <Button className="w-full" onClick={applyCustomRange} type="button">
            Áp dụng
          </Button>
        </div>
      </ResponsiveModal>
    </>
  );
}
