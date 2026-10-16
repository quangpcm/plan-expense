'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpFromLine,
  ArrowUpRight,
  CalendarRange,
  Clock,
  Paperclip,
  Pencil,
  Trash2,
  type LucideIcon,
} from 'lucide-react';

import {
  MemberActionsMenu,
  type MemberActionMenuItem,
} from '@/modules/member/components/member-actions-menu';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import {
  getDebtBalanceChangeSign,
  isDebtTransactionCashIn,
  type CounterpartyDebtLedger,
} from '@/modules/debt-tracking/calculators/debt-calculators';
import {
  categoryIconMap,
  getDebtTransactionCategoryTone,
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
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog';
import { DateField } from '@/shared/components/ui/date-field';
import { ResponsiveModal } from '@/shared/components/ui/responsive-modal';
import { formatCompactCurrency } from '@/shared/utils/currency';
import { formatCompactDateTime, formatDate } from '@/shared/utils/date';
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
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const occurredAt = timestampToDate(transaction.occurredAt) ?? new Date();
  const isLoan = transaction.type === 'loan';
  const isReceivable = transaction.direction === 'receivable';
  // Nhãn hành động — 4 tổ hợp type×direction, đặt tên theo hành động (không dùng đại từ
  // "Tôi"/"Đã") để nhất quán và không phụ thuộc người đọc tự suy ra ai là chủ thể.
  const label = isLoan
    ? isReceivable
      ? 'Cho vay'
      : 'Vay tiền'
    : isReceivable
      ? 'Thu hồi nợ'
      : 'Trả nợ';
  // Icon/nhãn dòng tiền thực tế (vào/ra ví) — độc lập với dấu +/- (biến động công nợ) và
  // với màu (loại công nợ). Dùng màu trung tính để không chồng ý nghĩa với xanh/đỏ.
  const isCashIn = isDebtTransactionCashIn(transaction);
  const CashFlowIcon = isCashIn ? ArrowDownToLine : ArrowUpFromLine;
  const cashFlowLabel = isCashIn ? 'Tiền vào' : 'Tiền ra';
  // Dấu +/- biểu thị biến động công nợ (tăng/giảm) — xem getDebtBalanceChangeSign.
  const balanceChangeSign = getDebtBalanceChangeSign(transaction);
  // Icon tròn đầu dòng: luôn hiển thị icon + màu của category (kể cả 'repayment', coi như
  // 1 category cố định trong categoryIconMap/categoryIconToneMap) — không còn theo
  // `direction` nữa, vì category đã đủ để nhận diện nội dung giao dịch, không cần tag
  // category riêng bên dưới nữa (xem chỗ bỏ Badge category). Màu loại công nợ (phải thu/
  // phải trả) vẫn còn ở tag trạng thái + số tiền bên dưới, không mất đi.
  const CategoryIcon =
    categoryIconMap[transaction.category ?? 'other'] ?? categoryIconMap.other;
  const categoryTone = getDebtTransactionCategoryTone(transaction.category);
  // Icon riêng cho Tag trạng thái (khác icon tròn ở trên) — mũi tên theo `type`, không đổi
  // theo direction: loan (cho vay/vay tiền) luôn arrow-up-right, repayment (thu hồi/trả nợ)
  // luôn arrow-down-left. Màu tag vẫn theo `direction` như icon tròn.
  const TagIcon = isLoan ? ArrowUpRight : ArrowDownLeft;
  // Gộp Sửa/Xoá vào 1 menu "⋮" thay vì 2 icon-button luôn hiện cạnh nhau — đỡ chật chỗ trên
  // mobile. Xoá vẫn phải qua ConfirmDialog (popup) riêng, không tự xoá ngay khi chọn menu.
  const menuItems: MemberActionMenuItem[] = [
    { key: 'edit', label: 'Sửa giao dịch', icon: Pencil, onSelect: onEdit },
    {
      key: 'delete',
      label: 'Xoá giao dịch',
      icon: Trash2,
      destructive: true,
      onSelect: () => setIsConfirmDeleteOpen(true),
    },
  ];

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] p-3">
      <ConfirmDialog
        confirmLabel="Xoá"
        confirmVariant="destructive"
        description="Giao dịch này sẽ bị xoá vĩnh viễn và không thể hoàn tác."
        onConfirm={() => {
          onDelete();
          setIsConfirmDeleteOpen(false);
        }}
        onOpenChange={setIsConfirmDeleteOpen}
        open={isConfirmDeleteOpen}
        title="Xoá giao dịch này?"
      />
      <div className="flex items-start gap-2">
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full',
            categoryTone.iconBgColor,
            categoryTone.iconColor,
          )}
        >
          <CategoryIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 flex-1 line-clamp-2 break-words text-sm font-medium text-[var(--color-text-primary)]">
              {transaction.title || label}
            </p>
            <div className="flex shrink-0 items-start gap-1">
              <p
                className={cn(
                  'text-sm font-semibold',
                  isReceivable
                    ? 'text-[color:var(--color-income)]'
                    : 'text-[color:var(--color-expense)]',
                )}
              >
                {balanceChangeSign}
                {formatCompactCurrency(transaction.amount)}
              </p>
              {/* MemberActionsMenu's trigger cần đủ 44px (size-11) để làm tap-target, nhưng
                  số tiền text-sm bên cạnh chỉ ~20px — margin âm để nút không kéo cả hàng
                  cao lên 44px mà vẫn giữ nguyên vùng bấm thực tế. */}
              <div className="-my-2.5">
                <MemberActionsMenu
                  ariaLabel="Thêm tùy chọn cho giao dịch"
                  items={menuItems}
                  title="Tùy chọn giao dịch"
                />
              </div>
            </div>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <Badge
              className={cn(
                'gap-1 px-2 py-0.5',
                isReceivable
                  ? 'bg-[color:var(--color-income-soft)] text-[color:var(--color-income)]'
                  : 'bg-[color:var(--color-expense-soft)] text-[color:var(--color-expense)]',
              )}
            >
              <TagIcon className="size-3" />
              {label}
            </Badge>
            {/* <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
              <CashFlowIcon className="size-3" />
              {cashFlowLabel}
            </span> */}
            <div className="flex items-center gap-1">
              <Clock className="size-3.5 shrink-0" />
              <span>{formatCompactDateTime(occurredAt)}</span>
            </div>
            {isLoan && transaction.dueDate ? (
              <span className="text-[color:var(--color-warning)]">
                · Hạn trả:{' '}
                {formatDate(timestampToDate(transaction.dueDate) ?? occurredAt)}
              </span>
            ) : null}
          </div>
          {transaction.note || transaction.attachments.length > 0 ? (
            <div className="mt-1 flex items-center gap-2">
              {transaction.note ? (
                <p className="min-w-0 flex-1 truncate text-sm leading-6 text-[var(--color-text-muted)]">
                  {transaction.note}
                </p>
              ) : null}
              {transaction.attachments.length > 0 ? (
                <span className="flex shrink-0 items-center gap-1 text-xs text-[var(--color-text-muted)]">
                  <Paperclip className="size-3.5" />
                  {transaction.attachments.length}
                </span>
              ) : null}
            </div>
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
    <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
      <Card className="gap-0 overflow-hidden rounded-none border-0 p-0 shadow-none sm:rounded-[var(--radius-card)] sm:border sm:shadow-[0_18px_54px_color-mix(in_srgb,var(--color-overlay-backdrop)_18%,transparent)]">
        <div className="flex items-start gap-3 p-4 sm:p-5">
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

        <div className="space-y-3 p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 py-2.5 sm:px-4 sm:py-3">
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
            <div className="space-y-2">
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
