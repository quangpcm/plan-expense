'use client';

import { useMemo, useState } from 'react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { CounterpartyDebtLedger } from '@/modules/debt-tracking/calculators/debt-calculators';
import { debtTransactionService } from '@/modules/debt-tracking/services';
import type {
  DebtDirection,
  DebtTransaction,
} from '@/modules/debt-tracking/types/debt-transaction';
import { DebtNativeDetail } from '@/modules/debt-tracking/components/debt-native-detail';
import { DebtNativeList } from '@/modules/debt-tracking/components/debt-native-list';
import { DebtTransactionForm } from '@/modules/debt-tracking/components/debt-transaction-form';
import { usePlan } from '@/modules/plan/hooks/use-plan';
import { usePlanMembers } from '@/modules/member/hooks/use-plan-members';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { ResponsiveModal } from '@/shared/components/ui/responsive-modal';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/utils/cn';

type DebtNativeTabProps = {
  planId: string;
  members: PlanMemberDocument[];
  transactions: DebtTransaction[];
  counterpartyLedgers: CounterpartyDebtLedger[];
  isLoading: boolean;
  errorMessage: string | null;
};

type DebtListFilter = 'all' | 'receivable' | 'payable' | 'settled';

const DEBT_LIST_FILTER_OPTIONS: Array<{
  value: DebtListFilter;
  label: string;
}> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'receivable', label: 'Phải thu' },
  { value: 'payable', label: 'Phải trả' },
  { value: 'settled', label: 'Đã tất toán' },
];

function matchesDebtListFilter(
  ledger: CounterpartyDebtLedger,
  filter: DebtListFilter,
): boolean {
  switch (filter) {
    case 'receivable':
      return ledger.receivableOutstanding > 0;
    case 'payable':
      return ledger.payableOutstanding > 0;
    case 'settled':
      return (
        ledger.receivableOutstanding === 0 && ledger.payableOutstanding === 0
      );
    default:
      return true;
  }
}

type SheetState =
  // counterpartyMemberId/direction chỉ có khi mở từ "+ Ghi khoản vay" trong counterparty
  // detail (đã biết sẵn người đang xem) — nút "+ Ghi nhận khoản vay" ở đầu trang vẫn mở
  // mode này nhưng không truyền gì, để user tự chọn người/chiều nợ từ đầu.
  | {
      mode: 'create-loan';
      counterpartyMemberId?: string;
      direction?: DebtDirection;
    }
  | {
      mode: 'record-repayment';
      counterpartyMemberId: string;
      direction: DebtDirection;
    }
  | { mode: 'edit'; transaction: DebtTransaction }
  | null;

function resolveSheetCounterpartyName(
  sheet: SheetState,
  members: PlanMemberDocument[],
): string | undefined {
  if (!sheet) {
    return undefined;
  }

  const counterpartyMemberId =
    sheet.mode === 'edit'
      ? sheet.transaction.counterpartyMemberId
      : sheet.counterpartyMemberId;

  if (!counterpartyMemberId) {
    return undefined;
  }

  return members.find((member) => member.id === counterpartyMemberId)?.nickname;
}

export function DebtNativeTab({
  planId,
  members,
  transactions,
  counterpartyLedgers,
  isLoading,
  errorMessage,
}: DebtNativeTabProps) {
  const { plan } = usePlan(planId);
  const { currentMember } = usePlanMembers(planId);
  const [requestedMemberId, setRequestedMemberId] = useState<string | null>(
    null,
  );
  const [listFilter, setListFilter] = useState<DebtListFilter>('all');
  const [sheet, setSheet] = useState<SheetState>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(
    null,
  );

  const filteredLedgers = useMemo(
    () =>
      counterpartyLedgers.filter((ledger) =>
        matchesDebtListFilter(ledger, listFilter),
      ),
    [counterpartyLedgers, listFilter],
  );
  const listFilterCounts = useMemo(
    () =>
      Object.fromEntries(
        DEBT_LIST_FILTER_OPTIONS.map((option) => [
          option.value,
          counterpartyLedgers.filter((ledger) =>
            matchesDebtListFilter(ledger, option.value),
          ).length,
        ]),
      ) as Record<DebtListFilter, number>,
    [counterpartyLedgers],
  );

  // Falls back to the first counterparty (trong danh sách đã lọc) khi chưa chọn gì,
  // hoặc khi người đang chọn không còn khớp filter/không còn ledger (vd đã bị xoá).
  const selectedMemberId = useMemo(() => {
    if (
      requestedMemberId &&
      filteredLedgers.some(
        (ledger) => ledger.counterpartyMemberId === requestedMemberId,
      )
    ) {
      return requestedMemberId;
    }

    return filteredLedgers[0]?.counterpartyMemberId ?? null;
  }, [filteredLedgers, requestedMemberId]);

  const selectedLedger = useMemo(
    () =>
      counterpartyLedgers.find(
        (ledger) => ledger.counterpartyMemberId === selectedMemberId,
      ) ?? null,
    [counterpartyLedgers, selectedMemberId],
  );
  const selectedTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) => transaction.counterpartyMemberId === selectedMemberId,
      ),
    [transactions, selectedMemberId],
  );
  const selectedCounterpart = members.find(
    (member) => member.id === selectedMemberId,
  );
  const sheetCounterpartyName = resolveSheetCounterpartyName(sheet, members);

  async function handleDeleteTransaction(transaction: DebtTransaction) {
    if (!plan) {
      return;
    }

    setActionErrorMessage(null);

    try {
      await debtTransactionService.deleteDebtTransaction(
        plan,
        transaction,
        currentMember,
      );
    } catch (error) {
      setActionErrorMessage(
        error instanceof Error ? error.message : 'Không thể xoá giao dịch này.',
      );
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        description="Theo dõi các khoản vay, trả và số dư công nợ với từng người."
        eyebrow="Khoản nợ"
        title="Sổ công nợ"
      />
      {errorMessage ? (
        <AuthFormMessage message={errorMessage} type="error" />
      ) : null}
      {actionErrorMessage ? (
        <AuthFormMessage message={actionErrorMessage} type="error" />
      ) : null}

      <div className="flex justify-end">
        <Button onClick={() => setSheet({ mode: 'create-loan' })} type="button">
          + Ghi nhận khoản vay
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {DEBT_LIST_FILTER_OPTIONS.map((option) => {
          const isActive = listFilter === option.value;

          return (
            <button
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                isActive
                  ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]'
                  : 'border-[var(--color-border-subtle)] bg-[var(--color-surface-default)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-default)]',
              )}
              key={option.value}
              onClick={() => setListFilter(option.value)}
              type="button"
            >
              {option.label} {listFilterCounts[option.value]}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
            Công nợ theo người
          </h3>
          {isLoading ? (
            <Skeleton className="h-52 rounded-[28px]" />
          ) : (
            <DebtNativeList
              ledgers={filteredLedgers}
              members={members}
              onSelect={setRequestedMemberId}
              selectedMemberId={selectedMemberId}
            />
          )}
        </div>
        <div className="space-y-4 border-t border-[var(--color-border-subtle)] pt-5 xl:border-0 xl:pt-0">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
            Chi tiết giao dịch
          </h3>
          {selectedLedger ? (
            <DebtNativeDetail
              counterpart={selectedCounterpart}
              key={selectedLedger.counterpartyMemberId}
              ledger={selectedLedger}
              onDeleteTransaction={handleDeleteTransaction}
              onEditTransaction={(transaction) =>
                setSheet({ mode: 'edit', transaction })
              }
              onRecordLoan={(direction) =>
                selectedMemberId
                  ? setSheet({
                      mode: 'create-loan',
                      counterpartyMemberId: selectedMemberId,
                      direction,
                    })
                  : setSheet({ mode: 'create-loan' })
              }
              onRecordRepayment={(direction) =>
                selectedMemberId
                  ? setSheet({
                      mode: 'record-repayment',
                      counterpartyMemberId: selectedMemberId,
                      direction,
                    })
                  : undefined
              }
              transactions={selectedTransactions}
            />
          ) : (
            <Card className="border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] shadow-none">
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                {counterpartyLedgers.length === 0
                  ? 'Chưa có khoản nợ nào. Ghi nhận khoản vay đầu tiên để bắt đầu theo dõi.'
                  : filteredLedgers.length === 0
                    ? 'Không có ai khớp với bộ lọc đã chọn.'
                    : 'Chọn một người để xem số dư và lịch sử giao dịch.'}
              </p>
            </Card>
          )}
        </div>
      </div>

      <ResponsiveModal
        {...(sheetCounterpartyName
          ? { description: `Với ${sheetCounterpartyName}` }
          : {})}
        onOpenChange={(next) => {
          if (!next) {
            setSheet(null);
          }
        }}
        open={sheet !== null}
        title={
          sheet?.mode === 'edit'
            ? sheet.transaction.type === 'loan'
              ? 'Sửa khoản vay'
              : 'Sửa khoản đã trả'
            : sheet?.mode === 'record-repayment'
              ? 'Ghi nhận đã trả'
              : 'Ghi nhận khoản vay'
        }
      >
        {sheet ? (
          <DebtTransactionForm
            fixedCounterpartyMemberId={
              sheet.mode === 'record-repayment'
                ? sheet.counterpartyMemberId
                : sheet.mode === 'create-loan'
                  ? sheet.counterpartyMemberId
                  : undefined
            }
            fixedDirection={
              sheet.mode === 'record-repayment' ? sheet.direction : undefined
            }
            initialDirection={
              sheet.mode === 'create-loan' ? sheet.direction : undefined
            }
            onCancel={() => setSheet(null)}
            onSuccess={() => setSheet(null)}
            planId={planId}
            transaction={sheet.mode === 'edit' ? sheet.transaction : undefined}
            transactions={transactions}
            type={
              sheet.mode === 'record-repayment'
                ? 'repayment'
                : sheet.mode === 'edit'
                  ? sheet.transaction.type
                  : 'loan'
            }
          />
        ) : null}
      </ResponsiveModal>
    </div>
  );
}
