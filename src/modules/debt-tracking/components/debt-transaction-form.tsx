'use client';

import { useMemo, useState } from 'react';
import { ZodError } from 'zod';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import { useAuthSession } from '@/modules/auth/hooks/use-auth-session';
import { usePlanMembers } from '@/modules/member/hooks/use-plan-members';
import { memberService } from '@/modules/member/services';
import { usePlan } from '@/modules/plan/hooks/use-plan';
import { calculateOutstanding } from '@/modules/debt-tracking/calculators/debt-calculators';
import {
  getDebtTransactionCategoryOptions,
  type DebtTransactionCategory,
} from '@/modules/debt-tracking/constants/debt-transaction-category';
import { createDebtTransactionSchema } from '@/modules/debt-tracking/schemas/create-debt-transaction.schema';
import { updateDebtTransactionSchema } from '@/modules/debt-tracking/schemas/update-debt-transaction.schema';
import { debtTransactionService } from '@/modules/debt-tracking/services';
import type { DebtDirection, DebtTransaction } from '@/modules/debt-tracking/types/debt-transaction';
import { CounterpartyPicker } from '@/modules/debt-tracking/components/counterparty-picker';
import { AttachmentPicker, type AttachmentDraft } from '@/modules/storage';
import { AmountInput } from '@/shared/components/ui/amount-input';
import { Button } from '@/shared/components/ui/button';
import { DateField } from '@/shared/components/ui/date-field';
import { DateTimeInput } from '@/shared/components/ui/date-time-input';
import { DropdownSelect } from '@/shared/components/ui/dropdown-select';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateTimeLocalInput, parseDateTimeLocalInput } from '@/shared/utils/date';
import { cn } from '@/shared/utils/cn';

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDateInputValue(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function parseOccurredAtInputValue(value: string): Date {
  return parseDateTimeLocalInput(value) ?? new Date();
}

type DebtTransactionFormProps = {
  planId: string;
  type: DebtTransaction['type'];
  transactions: DebtTransaction[];
  // Ghi nhận repayment mở từ counterparty detail đã biết sẵn người + chiều nợ.
  fixedCounterpartyMemberId?: string | undefined;
  fixedDirection?: DebtDirection | undefined;
  transaction?: DebtTransaction | undefined;
  onSuccess?: (() => void) | undefined;
  onCancel?: (() => void) | undefined;
};

export function DebtTransactionForm({
  planId,
  type,
  transactions,
  fixedCounterpartyMemberId,
  fixedDirection,
  transaction,
  onSuccess,
  onCancel,
}: DebtTransactionFormProps) {
  const { user } = useAuthSession();
  const { plan } = usePlan(planId);
  const { members, currentMember } = usePlanMembers(planId);

  const [direction, setDirection] = useState<DebtDirection>(
    transaction?.direction ?? fixedDirection ?? 'receivable',
  );
  const [counterpartyMemberId, setCounterpartyMemberId] = useState(
    transaction?.counterpartyMemberId ?? fixedCounterpartyMemberId ?? '',
  );
  const categoryOptions = useMemo(() => getDebtTransactionCategoryOptions(type), [type]);
  const [title, setTitle] = useState(transaction?.title ?? '');
  const [category, setCategory] = useState<DebtTransactionCategory>(
    transaction?.category ?? categoryOptions[0]!.value,
  );
  const [amount, setAmount] = useState(transaction?.amount ?? 0);
  const [occurredAt, setOccurredAt] = useState(
    transaction ? formatDateTimeLocalInput(transaction.occurredAt.toDate()) : formatDateTimeLocalInput(new Date()),
  );
  const [dueDate, setDueDate] = useState(
    transaction?.dueDate ? toDateInputValue(transaction.dueDate.toDate()) : '',
  );
  const [note, setNote] = useState(transaction?.note ?? '');
  const [attachments, setAttachments] = useState<AttachmentDraft[]>(
    (transaction?.attachments ?? []).map((attachment) => ({ kind: 'existing', id: attachment.id, attachment })),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCounterpartyLocked = Boolean(fixedCounterpartyMemberId) || Boolean(transaction);
  const isDirectionLocked = Boolean(fixedDirection) || Boolean(transaction);

  const outstanding = useMemo(() => {
    if (!counterpartyMemberId) {
      return 0;
    }

    const counterpartyTransactions = transactions.filter(
      (item) => item.counterpartyMemberId === counterpartyMemberId && item.id !== transaction?.id,
    );

    return calculateOutstanding(counterpartyTransactions, direction);
  }, [counterpartyMemberId, direction, transaction?.id, transactions]);

  const submitLabel = type === 'loan' ? 'Ghi nhận khoản nợ' : 'Ghi nhận đã trả';

  async function handleAddGuest(nickname: string) {
    if (!user) {
      throw new Error('Bạn cần đăng nhập để thêm đối tượng mới.');
    }

    return memberService.addGuest(planId, { nickname, role: 'viewer' }, user, currentMember);
  }

  async function handleSubmit() {
    if (!plan || !user) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (!transaction) {
        const parsed = createDebtTransactionSchema.parse({
          counterpartyMemberId,
          direction,
          type,
          title,
          category,
          amount,
          occurredAt,
          dueDate: type === 'loan' ? dueDate : '',
          note,
          attachments,
        });

        await debtTransactionService.createDebtTransaction(
          {
            counterpartyMemberId: parsed.counterpartyMemberId,
            direction: parsed.direction,
            type: parsed.type,
            title: parsed.title,
            category: parsed.category,
            amount: parsed.amount,
            occurredAt: parseOccurredAtInputValue(parsed.occurredAt),
            dueDate: parsed.dueDate ? parseDateInputValue(parsed.dueDate) : null,
            note: parsed.note,
            attachments: parsed.attachments,
          },
          {
            plan,
            currentMember,
            currentUser: user,
            existingTransactions: transactions,
          },
        );
      } else {
        const parsed = updateDebtTransactionSchema.parse({
          title,
          category,
          amount,
          occurredAt,
          dueDate: transaction.type === 'loan' ? dueDate : '',
          note,
          attachments,
        });

        await debtTransactionService.updateDebtTransaction(
          {
            transactionId: transaction.id,
            title: parsed.title,
            category: parsed.category,
            amount: parsed.amount,
            occurredAt: parseOccurredAtInputValue(parsed.occurredAt),
            dueDate: parsed.dueDate ? parseDateInputValue(parsed.dueDate) : null,
            note: parsed.note,
            attachments: parsed.attachments,
          },
          {
            plan,
            currentMember,
            currentUser: user,
            existingTransactions: transactions,
          },
          transaction,
        );
      }

      onSuccess?.();
    } catch (error) {
      if (error instanceof ZodError) {
        setErrorMessage(error.issues.map((issue) => issue.message).join(' | ') || 'Vui lòng kiểm tra lại thông tin.');
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Hiện chưa thể lưu giao dịch này.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1 text-center">
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#727687]" htmlFor="debt-amount">
          Số tiền (VND)
        </label>
        <AmountInput id="debt-amount" onChange={setAmount} value={amount} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="debt-title">
          Tên giao dịch
        </label>
        <Input
          id="debt-title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder={type === 'loan' ? 'Ví dụ: Cho anh A mượn tiền mua xe' : 'Ví dụ: Anh A trả tiền đợt 1'}
          value={title}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="debt-category">
          Danh mục
        </label>
        <DropdownSelect
          id="debt-category"
          onValueChange={(value) => setCategory(value as DebtTransactionCategory)}
          options={categoryOptions}
          value={category}
        />
      </div>

      {type === 'loan' && !isDirectionLocked ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            className={cn(
              'rounded-2xl border px-4 py-3 text-sm font-medium',
              direction === 'receivable'
                ? 'border-[#0050cb] bg-[#0050cb]/10 text-[#0050cb]'
                : 'border-[#c2c6d8] bg-white text-slate-700',
            )}
            onClick={() => setDirection('receivable')}
            type="button"
          >
            Người khác nợ tôi
          </button>
          <button
            className={cn(
              'rounded-2xl border px-4 py-3 text-sm font-medium',
              direction === 'payable'
                ? 'border-[#0050cb] bg-[#0050cb]/10 text-[#0050cb]'
                : 'border-[#c2c6d8] bg-white text-slate-700',
            )}
            onClick={() => setDirection('payable')}
            type="button"
          >
            Tôi nợ người khác
          </button>
        </div>
      ) : null}

      {!isCounterpartyLocked ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Người</label>
          <CounterpartyPicker
            currentMemberId={currentMember?.id ?? null}
            members={members}
            onAddGuest={handleAddGuest}
            onChange={setCounterpartyMemberId}
            value={counterpartyMemberId}
          />
        </div>
      ) : null}

      {type === 'repayment' && counterpartyMemberId ? (
        <div className="rounded-2xl border border-[#c2c6d8] bg-white px-4 py-3 text-sm text-slate-700">
          <span className="block text-xs text-[#727687]">Còn nợ</span>
          <span className="mt-1 block font-medium text-[#191c1e]">{formatCurrency(outstanding)}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="debt-occurredAt">
            {type === 'loan' ? 'Ngày vay' : 'Ngày trả'}
          </label>
          <DateTimeInput
            id="debt-occurredAt"
            onChange={(event) => setOccurredAt(event.target.value)}
            value={occurredAt}
          />
        </div>
        {type === 'loan' ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="debt-dueDate">
              Hạn trả <span className="font-normal text-slate-400">(không bắt buộc)</span>
            </label>
            <DateField id="debt-dueDate" onChange={(event) => setDueDate(event.target.value)} value={dueDate} />
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="debt-note">
          Ghi chú
        </label>
        <Textarea
          id="debt-note"
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ghi chú thêm (không bắt buộc)"
          value={note}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Đính kèm</p>
        <AttachmentPicker label="Thêm ảnh" maxCount={5} onChange={setAttachments} value={attachments} />
      </div>

      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}

      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button onClick={onCancel} type="button" variant="ghost">
            Huỷ
          </Button>
        ) : null}
        <Button
          disabled={isSubmitting || !counterpartyMemberId || amount <= 0 || !title.trim()}
          onClick={handleSubmit}
          type="button"
        >
          {isSubmitting ? 'Đang lưu...' : submitLabel}
        </Button>
      </div>
    </div>
  );
}
