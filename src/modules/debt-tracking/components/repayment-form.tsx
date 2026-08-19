'use client';

import { useState } from 'react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import type { AuthUser } from '@/modules/auth/types/auth';
import type { DebtDocument, RecordRepaymentInput } from '@/modules/debt-tracking/types/debt-tracking';
import { debtTrackingService } from '@/modules/debt-tracking/services';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import { Button } from '@/shared/components/ui/button';

type RepaymentFormProps = {
  debt: DebtDocument;
  plan: PlanDocument;
  currentUser: AuthUser;
  currentMember: PlanMemberDocument | null;
  onCancel: () => void;
  onSuccess: () => void;
};

function getTodayValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function RepaymentForm({
  debt,
  plan,
  currentUser,
  currentMember,
  onCancel,
  onSuccess,
}: RepaymentFormProps) {
  const [amount, setAmount] = useState('');
  const [paidAt, setPaidAt] = useState(getTodayValue());
  const [note, setNote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const input: RecordRepaymentInput = {
        debtId: debt.id,
        amount: Number(amount),
        note,
        paidAt,
      };

      await debtTrackingService.recordRepayment(plan, input, currentUser, currentMember);
      onSuccess();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to record repayment.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        Ghi nhận một lần hoàn trả cho khoản: <span className="font-medium text-slate-900">{debt.title}</span>
      </div>
      <label className="grid gap-2 text-sm text-slate-700">
        Số tiền trả
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0"
          type="number"
          value={amount}
        />
      </label>
      <label className="grid gap-2 text-sm text-slate-700">
        Ngày trả
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
          onChange={(event) => setPaidAt(event.target.value)}
          type="date"
          value={paidAt}
        />
      </label>
      <label className="grid gap-2 text-sm text-slate-700">
        Ghi chú
        <textarea
          className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ví dụ: đã chuyển khoản đợt 1"
          value={note}
        />
      </label>
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} variant="ghost">
          Hủy
        </Button>
        <Button disabled={isSubmitting} onClick={() => void handleSubmit()}>
          {isSubmitting ? 'Đang lưu...' : 'Ghi nhận trả nợ'}
        </Button>
      </div>
    </div>
  );
}
