'use client';

import { useState } from 'react';

import { AuthFormMessage } from '@/modules/auth/components/auth-form-message';
import type { AuthUser } from '@/modules/auth/types/auth';
import type { PlanMemberDocument } from '@/modules/member/types/member';
import type { PlanDocument } from '@/modules/plan/types/plan';
import { debtTrackingService } from '@/modules/debt-tracking/services';
import type { CreateDebtInput, DebtDirection } from '@/modules/debt-tracking/types/debt-tracking';
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
  const [counterpartMemberId, setCounterpartMemberId] = useState('');
  const [direction, setDirection] = useState<DebtDirection>('lent');
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
        counterpartMemberId,
        direction,
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
          placeholder="Ví dụ: Mượn tiền đóng tiền nhà tháng 8"
          value={title}
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-slate-700">
          Kiểu khoản nợ
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
            onChange={(event) => setDirection(event.target.value as DebtDirection)}
            value={direction}
          >
            <option value="lent">Tôi cho người này mượn</option>
            <option value="borrowed">Tôi mượn từ người này</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm text-slate-700">
          Thành viên còn lại
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
            onChange={(event) => setCounterpartMemberId(event.target.value)}
            value={counterpartMemberId}
          >
            <option value="">Chọn thành viên</option>
            {members
              .filter((member) => member.id !== currentMember?.id)
              .map((member) => (
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
          placeholder="Ghi thêm bối cảnh khoản vay nếu cần"
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
