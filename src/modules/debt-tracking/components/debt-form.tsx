'use client';

import { useState } from 'react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import type { AuthUser } from '@/modules/auth/types/auth';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import { debtTrackingService } from '@/modules/debt-tracking/services';
import type { CreateDebtInput } from '@/modules/debt-tracking/types/debt-tracking';
import { Button } from '@/shared/components/ui/button';

type DebtFormProps = {
  plan: PlanDocument;
  members: PlanMemberDocument[];
  currentUser: AuthUser;
  currentMember: PlanMemberDocument | null;
  onCancel: () => void;
  onSuccess: () => void;
};

export function DebtForm({
  plan,
  members,
  currentUser,
  currentMember,
  onCancel,
  onSuccess,
}: DebtFormProps) {
  const [title, setTitle] = useState('');
  const [borrowerMemberId, setBorrowerMemberId] = useState('');
  const [lenderMemberId, setLenderMemberId] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const input: CreateDebtInput = {
        title,
        borrowerMemberId,
        lenderMemberId,
        principalAmount: Number(principalAmount),
        dueDate,
        note,
      };

      await debtTrackingService.createDebt(plan, input, currentUser, currentMember);
      onSuccess();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create debt.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {errorMessage ? <AuthFormMessage message={errorMessage} type="error" /> : null}
      <label className="grid gap-2 text-sm text-slate-700">
        Tên khoản vay
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ví dụ: Ứng tiền thuê nhà tháng 8"
          value={title}
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-slate-700">
          Người vay
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
            onChange={(event) => setBorrowerMemberId(event.target.value)}
            value={borrowerMemberId}
          >
            <option value="">Chưa chọn</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.nickname}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Người cho vay
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
            onChange={(event) => setLenderMemberId(event.target.value)}
            value={lenderMemberId}
          >
            <option value="">Chưa chọn</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.nickname}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-slate-700">
          Số tiền gốc
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
            onChange={(event) => setPrincipalAmount(event.target.value)}
            placeholder="0"
            type="number"
            value={principalAmount}
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Hạn trả
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
            onChange={(event) => setDueDate(event.target.value)}
            type="date"
            value={dueDate}
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm text-slate-700">
        Ghi chú
        <textarea
          className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
          onChange={(event) => setNote(event.target.value)}
          value={note}
        />
      </label>
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} variant="ghost">
          Hủy
        </Button>
        <Button disabled={isSubmitting} onClick={() => void handleSubmit()}>
          {isSubmitting ? 'Đang lưu...' : 'Tạo khoản vay'}
        </Button>
      </div>
    </div>
  );
}
