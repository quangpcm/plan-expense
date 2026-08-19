'use client';

import { useMemo, useState } from 'react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { CounterpartyDebtLedger, PlanDebtSummary } from '@/modules/debt-tracking/calculators/debt-calculators';
import { debtTransactionService } from '@/modules/debt-tracking/services';
import type { DebtDirection, DebtTransaction } from '@/modules/debt-tracking/types/debt-transaction';
import { DebtNativeDetail } from '@/modules/debt-tracking/components/debt-native-detail';
import { DebtNativeList } from '@/modules/debt-tracking/components/debt-native-list';
import { DebtTransactionForm } from '@/modules/debt-tracking/components/debt-transaction-form';
import { usePlan } from '@/modules/plan/hooks/use-plan';
import { usePlanMembers } from '@/modules/member/hooks/use-plan-members';
import { BottomSheet } from '@/shared/components/ui/bottom-sheet';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { SectionHeading } from '@/shared/components/ui/section-heading';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatCompactCurrency } from '@/shared/utils/currency';

type DebtNativeTabProps = {
  planId: string;
  members: PlanMemberDocument[];
  transactions: DebtTransaction[];
  counterpartyLedgers: CounterpartyDebtLedger[];
  planSummary: PlanDebtSummary;
  isLoading: boolean;
  errorMessage: string | null;
};

type SheetState =
  | { mode: 'create-loan' }
  | { mode: 'record-repayment'; counterpartyMemberId: string; direction: DebtDirection }
  | { mode: 'edit'; transaction: DebtTransaction }
  | null;

export function DebtNativeTab({
  planId,
  members,
  transactions,
  counterpartyLedgers,
  planSummary,
  isLoading,
  errorMessage,
}: DebtNativeTabProps) {
  const { plan } = usePlan(planId);
  const { currentMember } = usePlanMembers(planId);
  const [requestedMemberId, setRequestedMemberId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // Falls back to the first counterparty when nothing is explicitly selected yet,
  // or when the previously selected one no longer has any ledger (e.g. deleted).
  const selectedMemberId = useMemo(() => {
    if (
      requestedMemberId &&
      counterpartyLedgers.some((ledger) => ledger.counterpartyMemberId === requestedMemberId)
    ) {
      return requestedMemberId;
    }

    return counterpartyLedgers[0]?.counterpartyMemberId ?? null;
  }, [counterpartyLedgers, requestedMemberId]);

  const selectedLedger = useMemo(
    () => counterpartyLedgers.find((ledger) => ledger.counterpartyMemberId === selectedMemberId) ?? null,
    [counterpartyLedgers, selectedMemberId],
  );
  const selectedTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.counterpartyMemberId === selectedMemberId),
    [transactions, selectedMemberId],
  );
  const selectedCounterpart = members.find((member) => member.id === selectedMemberId);

  async function handleDeleteTransaction(transaction: DebtTransaction) {
    if (!plan) {
      return;
    }

    setActionErrorMessage(null);

    try {
      await debtTransactionService.deleteDebtTransaction(plan, transaction, currentMember);
    } catch (error) {
      setActionErrorMessage(error instanceof Error ? error.message : 'Không thể xoá giao dịch này.');
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        description="Ghi nhận từng lần cho vay/đi vay và trả nợ để biết ai đang nợ bạn và bạn đang nợ ai."
        eyebrow="Khoản nợ"
        title="Sổ công nợ"
      />
      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      {actionErrorMessage ? <AuthFormMessage message={actionErrorMessage} type="error" /> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Tổng phải thu</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {formatCompactCurrency(planSummary.totalReceivableOutstanding)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Tổng phải trả</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-expense)]">
            {formatCompactCurrency(planSummary.totalPayableOutstanding)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Chênh lệch ròng</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {planSummary.netPosition >= 0 ? '+' : ''}
            {formatCompactCurrency(planSummary.netPosition)}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {planSummary.activeCounterpartyCount} đối tượng đang có công nợ.
          </p>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setSheet({ mode: 'create-loan' })} type="button">
          + Ghi nhận khoản nợ
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-52 rounded-[28px]" />
          ) : (
            <DebtNativeList
              ledgers={counterpartyLedgers}
              members={members}
              onSelect={setRequestedMemberId}
              selectedMemberId={selectedMemberId}
            />
          )}
        </div>
        <div className="space-y-4">
          {selectedLedger ? (
            <DebtNativeDetail
              counterpart={selectedCounterpart}
              ledger={selectedLedger}
              onDeleteTransaction={handleDeleteTransaction}
              onEditTransaction={(transaction) => setSheet({ mode: 'edit', transaction })}
              onRecordLoan={() => setSheet({ mode: 'create-loan' })}
              onRecordRepayment={(direction) =>
                selectedMemberId
                  ? setSheet({ mode: 'record-repayment', counterpartyMemberId: selectedMemberId, direction })
                  : undefined
              }
              transactions={selectedTransactions}
            />
          ) : (
            <Card className="border-slate-200 bg-slate-50 shadow-none">
              <p className="text-sm leading-6 text-slate-600">
                Chọn một đối tượng để xem chi tiết công nợ, hoặc ghi nhận khoản nợ đầu tiên.
              </p>
            </Card>
          )}
        </div>
      </div>

      <BottomSheet
        onClose={() => setSheet(null)}
        open={sheet !== null}
        showCloseButton
        title={
          sheet?.mode === 'edit'
            ? sheet.transaction.type === 'loan'
              ? 'Sửa khoản nợ'
              : 'Sửa khoản đã trả'
            : sheet?.mode === 'record-repayment'
              ? 'Ghi nhận đã trả'
              : 'Ghi nhận khoản nợ'
        }
      >
        {sheet ? (
          <DebtTransactionForm
            fixedCounterpartyMemberId={
              sheet.mode === 'record-repayment' ? sheet.counterpartyMemberId : undefined
            }
            fixedDirection={sheet.mode === 'record-repayment' ? sheet.direction : undefined}
            onCancel={() => setSheet(null)}
            onSuccess={() => setSheet(null)}
            planId={planId}
            transaction={sheet.mode === 'edit' ? sheet.transaction : undefined}
            transactions={transactions}
            type={sheet.mode === 'record-repayment' ? 'repayment' : sheet.mode === 'edit' ? sheet.transaction.type : 'loan'}
          />
        ) : null}
      </BottomSheet>
    </div>
  );
}
